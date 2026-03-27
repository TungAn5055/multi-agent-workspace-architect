import { Injectable } from '@nestjs/common';
import { AgentRole, Prisma, RunStatus, TopicStatus } from '@prisma/client';

import { ACTIVE_RUN_STATUSES } from 'src/common/constants/app.constants';
import { DbClient } from 'src/common/interfaces/db-client.interface';
import { ManagedLlmProvider } from 'src/config/app.config';
import { parseLlmProvider } from 'src/llm/llm.mapper';
import { PhaseTwoSchemaService } from 'src/prisma/phase-two-schema.service';
import { normalizeAgentName } from 'src/common/utils/name-normalizer';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTopicDto } from 'src/topics/dto/create-topic.dto';

export interface TopicAgentRecord {
  id: string;
  topicId: string;
  name: string;
  nameNormalized: string;
  role: AgentRole;
  provider: ManagedLlmProvider | null;
  model: string | null;
  description: string;
  sortOrder: number;
  isEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface OwnedTopicDetailRecord {
  id: string;
  userId: string;
  title: string;
  status: TopicStatus;
  sharedProvider: ManagedLlmProvider;
  sharedModel: string;
  firstMessageAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  agents: TopicAgentRecord[];
  runs: Array<{ id: string; status: RunStatus; createdAt: Date }>;
  _count: {
    agents: number;
    messages: number;
  };
}

export interface OwnedTopicSummaryRecord {
  id: string;
  userId: string;
  title: string;
  status: TopicStatus;
  sharedProvider: ManagedLlmProvider;
  sharedModel: string;
  firstMessageAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    agents: number;
    messages: number;
  };
  runs: Array<{
    id: string;
    status: RunStatus;
    createdAt: Date;
    updatedAt: Date;
    topicId: string;
    stopReason: string | null;
    triggerMessageId: string;
    startedAt: Date | null;
    finishedAt: Date | null;
    errorMessage: string | null;
    totalInputTokens: number;
    totalOutputTokens: number;
  }>;
}

interface TopicProviderRow {
  id: string;
  sharedProvider: ManagedLlmProvider;
}

interface AgentOverrideRow {
  id: string;
  provider: ManagedLlmProvider | null;
  model: string | null;
}

@Injectable()
export class TopicsRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly phaseTwoSchema: PhaseTwoSchemaService,
  ) {}

  async createTopic(
    userId: string,
    payload: CreateTopicDto,
    sharedProvider: ManagedLlmProvider,
    sharedModel: string,
  ): Promise<OwnedTopicDetailRecord> {
    await this.phaseTwoSchema.ensureSchema();

    const createdTopic = await this.prisma.$transaction(async (tx) => {
      const topic = await tx.topic.create({
        data: {
          userId,
          title: payload.title.trim(),
          status: TopicStatus.DRAFT,
          sharedModel,
        },
      });

      await tx.$executeRaw`
        UPDATE topics
        SET shared_provider = ${parseLlmProvider(sharedProvider)}::"LlmProvider"
        WHERE id = ${topic.id}::uuid
      `;

      for (const [index, agent] of payload.agents.entries()) {
        const createdAgent = await tx.topicAgent.create({
          data: {
            topicId: topic.id,
            name: agent.name.trim(),
            nameNormalized: normalizeAgentName(agent.name),
            role: agent.role.toUpperCase() as Prisma.TopicAgentCreateWithoutTopicInput['role'],
            description: agent.description.trim(),
            sortOrder: index,
            isEnabled: agent.isEnabled ?? true,
          },
        });

        const providerValue = agent.provider
          ? Prisma.sql`${parseLlmProvider(agent.provider)}::"LlmProvider"`
          : Prisma.sql`NULL`;
        await tx.$executeRaw(
          Prisma.sql`
            UPDATE topic_agents
            SET
              provider = ${providerValue},
              model = ${agent.model?.trim() || null}
            WHERE id = ${createdAgent.id}::uuid
          `,
        );
      }

      return topic;
    });

    const topic = await this.findOwnedTopicDetail(createdTopic.id, userId);
    if (!topic) {
      throw new Error(`Created topic ${createdTopic.id} could not be reloaded.`);
    }

    return topic;
  }

  async findOwnedTopic(topicId: string, userId: string) {
    return this.prisma.topic.findFirst({
      where: {
        id: topicId,
        userId,
      },
    });
  }

  async findOwnedTopicDetail(topicId: string, userId: string): Promise<OwnedTopicDetailRecord | null> {
    await this.phaseTwoSchema.ensureSchema();

    const topic = await this.prisma.topic.findFirst({
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

    if (!topic) {
      return null;
    }

    const sharedProvider = await this.loadTopicProvider(topic.id, userId);
    const agentOverrides = await this.loadAgentOverrides(topicId);

    return {
      ...topic,
      sharedProvider,
      agents: topic.agents.map((agent) => ({
        ...agent,
        provider: agentOverrides.get(agent.id)?.provider ?? null,
        model: agentOverrides.get(agent.id)?.model ?? null,
      })),
    };
  }

  async listOwnedTopics(userId: string): Promise<OwnedTopicSummaryRecord[]> {
    await this.phaseTwoSchema.ensureSchema();

    const topics = await this.prisma.topic.findMany({
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

    const providerMap = await this.loadTopicProviders(
      topics.map((topic) => topic.id),
      userId,
    );

    return topics.map((topic) => ({
      ...topic,
      sharedProvider: providerMap.get(topic.id) ?? 'openrouter',
    }));
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

  private async loadTopicProvider(topicId: string, userId: string): Promise<ManagedLlmProvider> {
    const rows = await this.prisma.$queryRaw<TopicProviderRow[]>`
      SELECT
        id,
        shared_provider AS "sharedProvider"
      FROM topics
      WHERE id = ${topicId}::uuid AND user_id = ${userId}
      LIMIT 1
    `;

    return rows[0]?.sharedProvider ?? 'openrouter';
  }

  private async loadTopicProviders(topicIds: string[], userId: string) {
    if (topicIds.length === 0) {
      return new Map<string, ManagedLlmProvider>();
    }

    const topicIdsSql = Prisma.join(topicIds.map((id) => Prisma.sql`${id}::uuid`));
    const rows = await this.prisma.$queryRaw<TopicProviderRow[]>(Prisma.sql`
      SELECT
        id,
        shared_provider AS "sharedProvider"
      FROM topics
      WHERE user_id = ${userId} AND id IN (${topicIdsSql})
    `);

    return new Map(rows.map((row) => [row.id, row.sharedProvider]));
  }

  private async loadAgentOverrides(topicId: string) {
    const rows = await this.prisma.$queryRaw<AgentOverrideRow[]>`
      SELECT
        id,
        provider,
        model
      FROM topic_agents
      WHERE topic_id = ${topicId}::uuid
    `;

    return new Map(rows.map((row) => [row.id, row]));
  }
}
