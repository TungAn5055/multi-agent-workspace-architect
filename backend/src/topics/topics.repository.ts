import { Injectable } from '@nestjs/common';
import { Prisma, RunStatus, TopicStatus } from '@prisma/client';

import { ACTIVE_RUN_STATUSES } from 'src/common/constants/app.constants';
import { DbClient } from 'src/common/interfaces/db-client.interface';
import { normalizeAgentName } from 'src/common/utils/name-normalizer';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTopicDto } from 'src/topics/dto/create-topic.dto';

@Injectable()
export class TopicsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createTopic(userId: string, payload: CreateTopicDto, sharedModel: string) {
    return this.prisma.topic.create({
      data: {
        userId,
        title: payload.title.trim(),
        status: TopicStatus.DRAFT,
        sharedModel,
        agents: {
          create: payload.agents.map((agent, index) => ({
            name: agent.name.trim(),
            nameNormalized: normalizeAgentName(agent.name),
            role: agent.role.toUpperCase() as Prisma.TopicAgentCreateWithoutTopicInput['role'],
            description: agent.description.trim(),
            sortOrder: index,
            isEnabled: agent.isEnabled ?? true,
          })),
        },
      },
      include: {
        agents: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  }

  async findOwnedTopic(topicId: string, userId: string) {
    return this.prisma.topic.findFirst({
      where: {
        id: topicId,
        userId,
      },
    });
  }

  async findOwnedTopicDetail(topicId: string, userId: string) {
    return this.prisma.topic.findFirst({
      where: {
        id: topicId,
        userId,
      },
      include: {
        agents: {
          orderBy: { sortOrder: 'asc' },
        },
        runs: {
          where: {
            status: { in: ACTIVE_RUN_STATUSES.map((status) => status.toUpperCase() as RunStatus) },
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        _count: {
          select: {
            agents: true,
            messages: true,
          },
        },
      },
    });
  }

  async listOwnedTopics(userId: string) {
    return this.prisma.topic.findMany({
      where: {
        userId,
      },
      include: {
        _count: {
          select: {
            agents: true,
            messages: true,
          },
        },
        runs: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  async hasHistory(topicId: string) {
    const count = await this.prisma.message.count({
      where: {
        topicId,
      },
    });

    return count > 0;
  }

  async updateTitle(topicId: string, title: string) {
    return this.prisma.topic.update({
      where: { id: topicId },
      data: { title: title.trim() },
    });
  }

  async archive(topicId: string) {
    return this.prisma.topic.update({
      where: { id: topicId },
      data: { status: TopicStatus.ARCHIVED },
    });
  }

  async markActivated(client: DbClient, topicId: string) {
    await client.topic.update({
      where: { id: topicId },
      data: {
        status: TopicStatus.ACTIVE,
        firstMessageAt: new Date(),
      },
    });
  }
}
