import { Injectable } from '@nestjs/common';
import { MessageStatus, RunStatus, RunStepStatus, SenderType } from '@prisma/client';

import { ACTIVE_RUN_STATUSES } from 'src/common/constants/app.constants';
import { DbClient } from 'src/common/interfaces/db-client.interface';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class RunsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async lockTopic(client: DbClient, topicId: string) {
    await client.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${topicId}))`;
  }

  async findActiveRun(topicId: string, client: DbClient = this.prisma) {
    return client.run.findFirst({
      where: {
        topicId,
        status: {
          in: ACTIVE_RUN_STATUSES.map((status) => status.toUpperCase() as RunStatus),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async createQueuedRun(client: DbClient, topicId: string, triggerMessageId: string) {
    return client.run.create({
      data: {
        topicId,
        triggerMessageId,
        status: RunStatus.QUEUED,
      },
    });
  }

  async findTopicRun(topicId: string, runId: string) {
    return this.prisma.run.findFirst({
      where: {
        id: runId,
        topicId,
      },
      include: {
        topic: true,
        triggerMessage: true,
        steps: {
          include: {
            agent: true,
            message: true,
          },
          orderBy: { stepIndex: 'asc' },
        },
      },
    });
  }

  async markRunning(runId: string) {
    return this.prisma.run.update({
      where: { id: runId },
      data: {
        status: RunStatus.RUNNING,
        startedAt: new Date(),
      },
    });
  }

  async markWaitingHuman(runId: string, stopReason = 'lead_requested_human_input') {
    return this.prisma.run.update({
      where: { id: runId },
      data: {
        status: RunStatus.WAITING_HUMAN,
        stopReason,
      },
    });
  }

  async markCompleted(runId: string) {
    return this.prisma.run.update({
      where: { id: runId },
      data: {
        status: RunStatus.COMPLETED,
        finishedAt: new Date(),
      },
    });
  }

  async markFailed(runId: string, errorMessage: string, stopReason = 'model_failure') {
    return this.prisma.run.update({
      where: { id: runId },
      data: {
        status: RunStatus.FAILED,
        stopReason,
        errorMessage,
        finishedAt: new Date(),
      },
    });
  }

  async markCancelled(runId: string, reason = 'cancelled_by_user') {
    return this.prisma.run.update({
      where: { id: runId },
      data: {
        status: RunStatus.CANCELLED,
        stopReason: reason,
        finishedAt: new Date(),
      },
    });
  }

  async createStep(
    client: DbClient,
    input: {
      runId: string;
      stepIndex: number;
      agentId: string;
      model: string;
      promptSnapshot: unknown;
      messageId: string;
    },
  ) {
    return client.runStep.create({
      data: {
        runId: input.runId,
        stepIndex: input.stepIndex,
        agentId: input.agentId,
        model: input.model,
        promptSnapshot: input.promptSnapshot as never,
        messageId: input.messageId,
        status: RunStepStatus.PENDING,
      },
    });
  }

  async markStepRunning(stepId: string) {
    return this.prisma.runStep.update({
      where: { id: stepId },
      data: {
        status: RunStepStatus.RUNNING,
      },
    });
  }

  async completeStep(
    stepId: string,
    data: {
      responseSnapshot: unknown;
      latencyMs: number;
      inputTokens: number;
      outputTokens: number;
    },
  ) {
    return this.prisma.runStep.update({
      where: { id: stepId },
      data: {
        status: RunStepStatus.COMPLETED,
        responseSnapshot: data.responseSnapshot as never,
        latencyMs: data.latencyMs,
        inputTokens: data.inputTokens,
        outputTokens: data.outputTokens,
      },
    });
  }

  async failStep(stepId: string, data: { stopReason: string; responseSnapshot?: unknown }) {
    return this.prisma.runStep.update({
      where: { id: stepId },
      data: {
        status: RunStepStatus.FAILED,
        stopReason: data.stopReason,
        responseSnapshot: data.responseSnapshot as never,
      },
    });
  }

  async cancelStep(stepId: string, reason = 'cancelled_by_user') {
    return this.prisma.runStep.update({
      where: { id: stepId },
      data: {
        status: RunStepStatus.CANCELLED,
        stopReason: reason,
      },
    });
  }

  async addRunUsage(runId: string, inputTokens: number, outputTokens: number) {
    await this.prisma.run.update({
      where: { id: runId },
      data: {
        totalInputTokens: { increment: inputTokens },
        totalOutputTokens: { increment: outputTokens },
      },
    });
  }

  async createSystemMessage(client: DbClient, topicId: string, runId: string | null, sequenceNo: number, content: string) {
    return client.message.create({
      data: {
        topicId,
        runId,
        senderType: SenderType.SYSTEM,
        senderName: 'System',
        contentMarkdown: content,
        status: MessageStatus.COMPLETED,
        sequenceNo,
      },
    });
  }
}
