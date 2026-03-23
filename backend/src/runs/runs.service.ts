import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { MessageStatus, RunStatus, SenderType } from '@prisma/client';
import { Queue } from 'bullmq';

import { OwnershipService } from 'src/auth/ownership.service';
import { RUNS_QUEUE } from 'src/common/constants/app.constants';
import { AppException } from 'src/common/exceptions/app.exception';
import { ERROR_CODES } from 'src/common/exceptions/error-codes';
import { detectMentions } from 'src/common/utils/mentions';
import { AppConfigService } from 'src/config/app-config.service';
import { MessagesRepository } from 'src/messages/messages.repository';
import { ObservabilityService } from 'src/observability/observability.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { TopicsRepository } from 'src/topics/topics.repository';
import { mapRunStatus } from 'src/topics/topics.mapper';
import { TopicsService } from 'src/topics/topics.service';
import { AgentsRepository } from 'src/agents/agents.repository';
import { PostHumanMessageDto } from 'src/messages/dto/post-human-message.dto';
import { CancelRunDto } from 'src/runs/dto/cancel-run.dto';
import { RunExecutionRegistryService } from 'src/runs/run-execution-registry.service';
import { StreamService } from 'src/stream/stream.service';
import { RunsRepository } from 'src/runs/runs.repository';

@Injectable()
export class RunsService {
  private readonly logger = new Logger(RunsService.name);

  constructor(
    private readonly topicsService: TopicsService,
    private readonly topicsRepository: TopicsRepository,
    private readonly ownershipService: OwnershipService,
    private readonly agentsRepository: AgentsRepository,
    private readonly messagesRepository: MessagesRepository,
    private readonly runsRepository: RunsRepository,
    private readonly prisma: PrismaService,
    private readonly appConfig: AppConfigService,
    private readonly streamService: StreamService,
    private readonly observability: ObservabilityService,
    private readonly executionRegistry: RunExecutionRegistryService,
    @InjectQueue(RUNS_QUEUE) private readonly runsQueue: Queue,
  ) {}

  async createRunFromHumanMessage(topicId: string, userId: string, payload: PostHumanMessageDto) {
    const topic = await this.topicsService.assertOwnedTopic(topicId, userId);
    this.ownershipService.assertOwner(topic.userId, userId);

    if (topic.status === 'ARCHIVED') {
      throw new AppException({
        status: 409,
        code: ERROR_CODES.topicArchived,
        message: 'Topic đã archive, không thể tạo run mới.',
      });
    }

    if (payload.clientRequestId) {
      const existing = await this.messagesRepository.findByClientRequestId(topicId, payload.clientRequestId);
      if (existing?.triggeredRuns[0]) {
        return {
          reused: true,
          message: this.mapMessage(existing),
          run: this.mapRun(existing.triggeredRuns[0]),
        };
      }
    }

    const agents = await this.agentsRepository.listByTopic(topicId);
    const mentions = detectMentions(
      payload.contentMarkdown,
      agents.map((agent) => ({ id: agent.id, name: agent.name })),
    );

    const result = await this.prisma.$transaction(async (tx) => {
      await this.runsRepository.lockTopic(tx, topicId);

      const activeRun = await this.runsRepository.findActiveRun(topicId, tx);
      if (activeRun && activeRun.status !== RunStatus.WAITING_HUMAN) {
        throw new AppException({
          status: 409,
          code: ERROR_CODES.activeRunExists,
          message: 'Topic đang có run active, chưa thể gửi thêm message.',
          details: { runId: activeRun.id, status: mapRunStatus(activeRun.status) },
        });
      }

      if (activeRun?.status === RunStatus.WAITING_HUMAN) {
        await tx.run.update({
          where: { id: activeRun.id },
          data: {
            status: RunStatus.COMPLETED,
            finishedAt: new Date(),
            stopReason: 'human_replied',
          },
        });
      }

      const sequenceNo = await this.messagesRepository.allocateSequenceNo(tx, topicId);
      const humanMessage = await this.messagesRepository.createMessage(tx, {
        topicId,
        clientRequestId: payload.clientRequestId,
        senderType: SenderType.HUMAN,
        senderName: 'Human',
        contentMarkdown: payload.contentMarkdown.trim(),
        mentionsJson: mentions,
        status: MessageStatus.COMPLETED,
        sequenceNo,
      });

      if (!topic.firstMessageAt) {
        await this.topicsRepository.markActivated(tx, topicId);
      }

      const run = await this.runsRepository.createQueuedRun(tx, topicId, humanMessage.id);
      return { humanMessage, run };
    });

    try {
      await this.runsQueue.add(
        RUNS_QUEUE,
        {
          runId: result.run.id,
          topicId,
          triggerMessageId: result.humanMessage.id,
        },
        {
          jobId: `run-${result.run.id}`,
          attempts: this.appConfig.queueRunAttempts,
          removeOnComplete: 50,
          removeOnFail: 100,
        },
      );
    } catch (error) {
      this.logger.error(`Failed to enqueue run ${result.run.id}`, error instanceof Error ? error.stack : undefined);
      await this.runsRepository.markFailed(result.run.id, 'Failed to enqueue orchestration job', 'queue_enqueue_failed');
      throw new AppException({
        status: 500,
        code: ERROR_CODES.internalError,
        message: 'Không thể đưa run vào hàng đợi xử lý.',
      });
    }

    this.streamService.publish(topicId, 'run.queued', {
      runId: result.run.id,
      topicId,
      triggerMessageId: result.humanMessage.id,
      status: 'queued',
    });

    return {
      reused: false,
      message: this.mapMessage(result.humanMessage),
      run: this.mapRun(result.run),
    };
  }

  async getRunDetail(topicId: string, runId: string, userId: string) {
    await this.topicsService.assertOwnedTopic(topicId, userId);
    const run = await this.runsRepository.findTopicRun(topicId, runId);
    if (!run) {
      throw new AppException({
        status: 404,
        code: ERROR_CODES.runNotFound,
        message: 'Không tìm thấy run.',
      });
    }

    return {
      id: run.id,
      topicId: run.topicId,
      triggerMessageId: run.triggerMessageId,
      status: mapRunStatus(run.status),
      stopReason: run.stopReason,
      errorMessage: run.errorMessage,
      startedAt: run.startedAt?.toISOString() ?? null,
      finishedAt: run.finishedAt?.toISOString() ?? null,
      totalInputTokens: run.totalInputTokens,
      totalOutputTokens: run.totalOutputTokens,
      createdAt: run.createdAt.toISOString(),
      updatedAt: run.updatedAt.toISOString(),
      steps: run.steps.map((step) => ({
        id: step.id,
        stepIndex: step.stepIndex,
        agentId: step.agentId,
        agentName: step.agent?.name ?? null,
        status: step.status.toLocaleLowerCase('en-US'),
        actionType: step.actionType,
        model: step.model,
        latencyMs: step.latencyMs,
        inputTokens: step.inputTokens,
        outputTokens: step.outputTokens,
        stopReason: step.stopReason,
        messageId: step.messageId,
        createdAt: step.createdAt.toISOString(),
      })),
    };
  }

  async cancelRun(topicId: string, runId: string, userId: string, payload: CancelRunDto) {
    await this.topicsService.assertOwnedTopic(topicId, userId);
    const run = await this.runsRepository.findTopicRun(topicId, runId);
    if (!run) {
      throw new AppException({
        status: 404,
        code: ERROR_CODES.runNotFound,
        message: 'Không tìm thấy run.',
      });
    }

    if (!['QUEUED', 'RUNNING', 'WAITING_HUMAN'].includes(run.status)) {
      throw new AppException({
        status: 409,
        code: ERROR_CODES.runNotActive,
        message: 'Run này không còn ở trạng thái có thể hủy.',
      });
    }

    await this.runsRepository.markCancelled(runId, payload.reason?.trim() || 'cancelled_by_user');
    this.executionRegistry.abort(runId);
    this.observability.increment('run_cancelled');

    await this.prisma.$transaction(async (tx) => {
      const sequenceNo = await this.messagesRepository.allocateSequenceNo(tx, topicId);
      await this.runsRepository.createSystemMessage(
        tx,
        topicId,
        runId,
        sequenceNo,
        `Run đã bị Human dừng. Lý do: ${payload.reason?.trim() || 'cancelled_by_user'}`,
      );
    });

    this.streamService.publish(topicId, 'run.cancelled', {
      runId,
      topicId,
      status: 'cancelled',
      stopReason: payload.reason?.trim() || 'cancelled_by_user',
    });

    return {
      id: runId,
      status: 'cancelled',
      stopReason: payload.reason?.trim() || 'cancelled_by_user',
    };
  }

  private mapRun(run: { id: string; topicId: string; status: Parameters<typeof mapRunStatus>[0]; createdAt: Date }) {
    return {
      id: run.id,
      topicId: run.topicId,
      status: mapRunStatus(run.status),
      createdAt: run.createdAt.toISOString(),
    };
  }

  private mapMessage(message: {
    id: string;
    topicId: string;
    runId: string | null;
    senderType: SenderType;
    senderName: string;
    senderAgentId: string | null;
    contentMarkdown: string;
    mentionsJson: unknown;
    status: MessageStatus;
    sequenceNo: number;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: message.id,
      topicId: message.topicId,
      runId: message.runId,
      senderType: message.senderType.toLocaleLowerCase('en-US'),
      senderAgentId: message.senderAgentId,
      senderName: message.senderName,
      contentMarkdown: message.contentMarkdown,
      mentions: Array.isArray(message.mentionsJson) ? message.mentionsJson : [],
      status: message.status.toLocaleLowerCase('en-US'),
      sequenceNo: message.sequenceNo,
      createdAt: message.createdAt.toISOString(),
      updatedAt: message.updatedAt.toISOString(),
    };
  }
}
