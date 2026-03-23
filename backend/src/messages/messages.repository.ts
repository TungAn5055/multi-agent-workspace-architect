import { Injectable } from '@nestjs/common';
import { MessageStatus, SenderType } from '@prisma/client';

import { DbClient } from 'src/common/interfaces/db-client.interface';
import { PrismaService } from 'src/prisma/prisma.service';

interface CreateMessageInput {
  topicId: string;
  runId?: string | null;
  clientRequestId?: string;
  senderType: SenderType;
  senderAgentId?: string | null;
  senderName: string;
  contentMarkdown: string;
  mentionsJson?: unknown;
  status: MessageStatus;
  sequenceNo: number;
}

@Injectable()
export class MessagesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async allocateSequenceNo(client: DbClient, topicId: string): Promise<number> {
    const rows = await client.$queryRaw<Array<{ sequenceNo: number }>>`
      UPDATE "topics"
      SET "next_sequence_no" = "next_sequence_no" + 1
      WHERE "id" = ${topicId}::uuid
      RETURNING "next_sequence_no" - 1 AS "sequenceNo"
    `;

    return Number(rows[0]?.sequenceNo ?? 1);
  }

  async createMessage(client: DbClient, input: CreateMessageInput) {
    return client.message.create({
      data: {
        topicId: input.topicId,
        runId: input.runId,
        clientRequestId: input.clientRequestId,
        senderType: input.senderType,
        senderAgentId: input.senderAgentId,
        senderName: input.senderName,
        contentMarkdown: input.contentMarkdown,
        mentionsJson: input.mentionsJson as never,
        status: input.status,
        sequenceNo: input.sequenceNo,
      },
    });
  }

  async listTimeline(topicId: string, limit: number, cursor?: number) {
    const messages = await this.prisma.message.findMany({
      where: {
        topicId,
        sequenceNo: cursor ? { lt: cursor } : undefined,
      },
      include: {
        senderAgent: true,
      },
      orderBy: {
        sequenceNo: 'desc',
      },
      take: limit + 1,
    });

    const hasMore = messages.length > limit;
    const page = hasMore ? messages.slice(0, limit) : messages;

    return {
      items: page.reverse(),
      nextCursor: hasMore ? page[page.length - 1]?.sequenceNo ?? null : null,
    };
  }

  async findByClientRequestId(topicId: string, clientRequestId: string) {
    return this.prisma.message.findFirst({
      where: {
        topicId,
        clientRequestId,
      },
      include: {
        triggeredRuns: true,
      },
    });
  }

  async listRecentTopicMessages(topicId: string, limit: number) {
    const items = await this.prisma.message.findMany({
      where: { topicId },
      include: {
        senderAgent: true,
      },
      orderBy: { sequenceNo: 'desc' },
      take: limit,
    });

    return items.reverse();
  }

  async findById(messageId: string) {
    return this.prisma.message.findUnique({
      where: { id: messageId },
      include: {
        senderAgent: true,
      },
    });
  }

  async updateMessage(messageId: string, data: Partial<Pick<CreateMessageInput, 'contentMarkdown' | 'mentionsJson' | 'status'>>) {
    return this.prisma.message.update({
      where: { id: messageId },
      data: {
        contentMarkdown: data.contentMarkdown,
        mentionsJson: data.mentionsJson as never,
        status: data.status,
      },
    });
  }
}
