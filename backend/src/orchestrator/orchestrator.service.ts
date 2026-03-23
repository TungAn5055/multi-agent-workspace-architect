import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { AgentRole, MessageStatus, RunStatus, SenderType } from '@prisma/client';

import { WAITING_HUMAN_MARKER } from 'src/common/constants/app.constants';
import { AppException } from 'src/common/exceptions/app.exception';
import { detectMentions } from 'src/common/utils/mentions';
import { AppConfigService } from 'src/config/app-config.service';
import { LlmGatewayService } from 'src/llm-gateway/llm-gateway.service';
import { MessagesRepository } from 'src/messages/messages.repository';
import { ObservabilityService } from 'src/observability/observability.service';
import { ParticipantSelectorService } from 'src/orchestrator/participant-selector.service';
import { PromptBuilderService } from 'src/orchestrator/prompt-builder.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { RunExecutionRegistryService } from 'src/runs/run-execution-registry.service';
import { RunsRepository } from 'src/runs/runs.repository';
import { StreamService } from 'src/stream/stream.service';
import { TopicsRepository } from 'src/topics/topics.repository';

interface RunJobPayload {
  runId: string;
  topicId: string;
  triggerMessageId: string;
}

@Injectable()
export class OrchestratorService {
  private readonly logger = new Logger(OrchestratorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly topicsRepository: TopicsRepository,
    private readonly messagesRepository: MessagesRepository,
    private readonly runsRepository: RunsRepository,
    private readonly streamService: StreamService,
    private readonly participantSelector: ParticipantSelectorService,
    private readonly promptBuilder: PromptBuilderService,
    private readonly llmGateway: LlmGatewayService,
    private readonly appConfig: AppConfigService,
    private readonly observability: ObservabilityService,
    private readonly executionRegistry: RunExecutionRegistryService,
  ) {}

  async process(job: Job<RunJobPayload>) {
    const { runId, topicId, triggerMessageId } = job.data;
    const run = await this.runsRepository.findTopicRun(topicId, runId);
    if (!run) {
      this.logger.warn(`Run ${runId} not found, skip processing.`);
      return;
    }

    if (run.status === RunStatus.CANCELLED || run.status === RunStatus.COMPLETED) {
      return;
    }

    await this.runsRepository.markRunning(runId);
    this.streamService.publish(topicId, 'run.started', {
      runId,
      topicId,
      triggerMessageId,
      status: 'running',
    });

    const topic = await this.topicsRepository.findOwnedTopicDetail(topicId, run.topic.userId);
    if (!topic) {
      await this.runsRepository.markFailed(runId, 'Topic no longer exists', 'topic_not_found');
      return;
    }

    const triggerMessage = await this.messagesRepository.findById(triggerMessageId);
    const recentMessages = await this.messagesRepository.listRecentTopicMessages(
      topicId,
      this.appConfig.orchestratorMaxRecentMessages,
    );

    const participants = this.participantSelector.selectParticipants(
      triggerMessage?.contentMarkdown ?? '',
      topic.agents,
    );

    const previousStepOutputs: Array<{ agentName: string; contentMarkdown: string }> = [];
    const resolvedSharedModel = this.appConfig.resolveLlmModel(topic.sharedModel);

    for (const [stepIndex, participant] of participants.entries()) {
      const currentRun = await this.runsRepository.findTopicRun(topicId, runId);
      if (!currentRun || currentRun.status === RunStatus.CANCELLED) {
        return;
      }

      const agent = topic.agents.find((item) => item.id === participant.agentId);
      if (!agent) {
        continue;
      }

      const promptPayload = this.promptBuilder.buildPrompt({
        topic: {
          title: topic.title,
          sharedModel: resolvedSharedModel,
        },
        agent,
        latestHumanMessage: triggerMessage?.contentMarkdown ?? '',
        recentMessages: recentMessages.map((message) => ({
          senderName: message.senderName,
          senderType: message.senderType.toLocaleLowerCase('en-US'),
          contentMarkdown: message.contentMarkdown,
        })),
        previousStepOutputs,
        stepGoal: participant.stepGoal,
      });

      const { step, message } = await this.prisma.$transaction(async (tx) => {
        const sequenceNo = await this.messagesRepository.allocateSequenceNo(tx, topicId);
        const messageRecord = await this.messagesRepository.createMessage(tx, {
          topicId,
          runId,
          senderType: SenderType.AGENT,
          senderAgentId: agent.id,
          senderName: agent.name,
          contentMarkdown: '',
          status: MessageStatus.PENDING,
          sequenceNo,
        });

        const stepRecord = await this.runsRepository.createStep(tx, {
          runId,
          stepIndex,
          agentId: agent.id,
          model: resolvedSharedModel,
          promptSnapshot: promptPayload,
          messageId: messageRecord.id,
        });

        return { step: stepRecord, message: messageRecord };
      });

      await this.messagesRepository.updateMessage(message.id, {
        status: MessageStatus.STREAMING,
        contentMarkdown: '',
      });
      await this.runsRepository.markStepRunning(step.id);

      this.streamService.publish(topicId, 'agent.started', {
        runId,
        topicId,
        stepId: step.id,
        agentId: agent.id,
        agentName: agent.name,
        messageId: message.id,
        sequenceNo: message.sequenceNo,
      });

      const abortController = new AbortController();
      this.executionRegistry.register(runId, abortController);
      const startedAt = Date.now();

      try {
        const reply = await this.llmGateway.streamAgentReply({
          model: resolvedSharedModel,
          instructions: promptPayload.instructions,
          prompt: promptPayload.prompt,
          signal: abortController.signal,
          onDelta: (delta) => {
            this.streamService.publish(topicId, 'agent.delta', {
              runId,
              topicId,
              stepId: step.id,
              messageId: message.id,
              delta,
            });
          },
        });

        const mentions = detectMentions(
          reply.content,
          topic.agents.map((item) => ({ id: item.id, name: item.name })),
        );

        await this.messagesRepository.updateMessage(message.id, {
          contentMarkdown: reply.content,
          mentionsJson: mentions,
          status: MessageStatus.COMPLETED,
        });
        await this.runsRepository.completeStep(step.id, {
          responseSnapshot: reply.responseSnapshot,
          latencyMs: Date.now() - startedAt,
          inputTokens: reply.inputTokens,
          outputTokens: reply.outputTokens,
        });
        await this.runsRepository.addRunUsage(runId, reply.inputTokens, reply.outputTokens);

        previousStepOutputs.push({
          agentName: agent.name,
          contentMarkdown: reply.content,
        });

        this.streamService.publish(topicId, 'agent.completed', {
          runId,
          topicId,
          stepId: step.id,
          agentId: agent.id,
          agentName: agent.name,
          messageId: message.id,
          contentMarkdown: reply.content,
          inputTokens: reply.inputTokens,
          outputTokens: reply.outputTokens,
        });

        if (agent.role === AgentRole.LEAD && this.needsHumanInput(reply.content)) {
          await this.runsRepository.markWaitingHuman(runId);
          this.observability.increment('run_waiting_human');
          this.streamService.publish(topicId, 'run.waiting_human', {
            runId,
            topicId,
            status: 'waiting_human',
            messageId: message.id,
          });
          return;
        }
      } catch (error) {
        if (abortController.signal.aborted) {
          await this.messagesRepository.updateMessage(message.id, {
            status: MessageStatus.FAILED,
          });
          await this.runsRepository.cancelStep(step.id);
          return;
        }

        await this.messagesRepository.updateMessage(message.id, {
          status: MessageStatus.FAILED,
        });
        await this.runsRepository.failStep(step.id, {
          stopReason: error instanceof Error ? error.message : 'agent_step_failed',
          responseSnapshot: {
            error: error instanceof Error ? error.message : String(error),
          },
        });
        await this.runsRepository.markFailed(
          runId,
          error instanceof AppException ? error.message : error instanceof Error ? error.message : 'Run failed',
        );
        await this.prisma.$transaction(async (tx) => {
          const sequenceNo = await this.messagesRepository.allocateSequenceNo(tx, topicId);
          await this.runsRepository.createSystemMessage(
            tx,
            topicId,
            runId,
            sequenceNo,
            `Run thất bại: ${error instanceof Error ? error.message : 'Run failed'}`,
          );
        });
        this.observability.increment('run_failed');
        this.streamService.publish(topicId, 'run.failed', {
          runId,
          topicId,
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Run failed',
        });
        return;
      } finally {
        this.executionRegistry.unregister(runId);
      }
    }

    const latestRun = await this.runsRepository.findTopicRun(topicId, runId);
    if (!latestRun || latestRun.status === RunStatus.CANCELLED) {
      return;
    }

    await this.runsRepository.markCompleted(runId);
    this.observability.increment('run_completed');
    this.streamService.publish(topicId, 'run.completed', {
      runId,
      topicId,
      status: 'completed',
    });
  }

  private needsHumanInput(content: string) {
    return content.includes(WAITING_HUMAN_MARKER);
  }
}
