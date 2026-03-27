import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { DbClient } from 'src/common/interfaces/db-client.interface';
import { ManagedLlmProvider } from 'src/config/app.config';
import { parseLlmProvider } from 'src/llm/llm.mapper';
import { PhaseTwoSchemaService } from 'src/prisma/phase-two-schema.service';
import { normalizeAgentName } from 'src/common/utils/name-normalizer';
import { PrismaService } from 'src/prisma/prisma.service';
import { AddAgentDto } from 'src/agents/dto/add-agent.dto';
import { UpdateAgentDto } from 'src/agents/dto/update-agent.dto';

interface AgentOverrideRow {
  id: string;
  provider: ManagedLlmProvider | null;
  model: string | null;
}

@Injectable()
export class AgentsRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly phaseTwoSchema: PhaseTwoSchemaService,
  ) {}

  async listByTopic(topicId: string) {
    await this.phaseTwoSchema.ensureSchema();

    const agents = await this.prisma.topicAgent.findMany({
      where: { topicId },
      orderBy: { sortOrder: 'asc' },
    });

    const overrides = await this.loadAgentOverridesByTopic(topicId);

    return agents.map((agent) => ({
      ...agent,
      provider: overrides.get(agent.id)?.provider ?? null,
      model: overrides.get(agent.id)?.model ?? null,
    }));
  }

  async findByTopicAndId(topicId: string, agentId: string) {
    await this.phaseTwoSchema.ensureSchema();

    const agent = await this.prisma.topicAgent.findFirst({
      where: {
        id: agentId,
        topicId,
      },
    });

    if (!agent) {
      return null;
    }

    const override = await this.loadAgentOverride(agent.id);

    return {
      ...agent,
      provider: override?.provider ?? null,
      model: override?.model ?? null,
    };
  }

  async hasDuplicateName(topicId: string, name: string, excludeAgentId?: string) {
    const existing = await this.prisma.topicAgent.findFirst({
      where: {
        topicId,
        nameNormalized: normalizeAgentName(name),
        id: excludeAgentId ? { not: excludeAgentId } : undefined,
      },
    });

    return Boolean(existing);
  }

  async create(topicId: string, payload: AddAgentDto) {
    await this.phaseTwoSchema.ensureSchema();

    const lastAgent = await this.prisma.topicAgent.findFirst({
      where: { topicId },
      orderBy: { sortOrder: 'desc' },
    });

    const agent = await this.prisma.topicAgent.create({
      data: {
        topicId,
        name: payload.name.trim(),
        nameNormalized: normalizeAgentName(payload.name),
        role: payload.role.toUpperCase() as never,
        description: payload.description.trim(),
        sortOrder: (lastAgent?.sortOrder ?? -1) + 1,
        isEnabled: payload.isEnabled ?? true,
      },
    });

    const providerValue = payload.provider
      ? Prisma.sql`${parseLlmProvider(payload.provider)}::"LlmProvider"`
      : Prisma.sql`NULL`;
    await this.prisma.$executeRaw(
      Prisma.sql`
        UPDATE topic_agents
        SET
          provider = ${providerValue},
          model = ${payload.model?.trim() || null}
        WHERE id = ${agent.id}::uuid
      `,
    );

    return (await this.findByTopicAndId(topicId, agent.id))!;
  }

  async update(agentId: string, payload: UpdateAgentDto) {
    await this.phaseTwoSchema.ensureSchema();

    const agent = await this.prisma.topicAgent.update({
      where: { id: agentId },
      data: {
        name: payload.name?.trim(),
        nameNormalized: payload.name ? normalizeAgentName(payload.name) : undefined,
        role: payload.role ? (payload.role.toUpperCase() as never) : undefined,
        description: payload.description?.trim(),
        isEnabled: payload.isEnabled,
      },
    });

    if (payload.provider !== undefined || payload.model !== undefined) {
      const currentOverride = await this.loadAgentOverride(agentId);
      const nextProvider =
        payload.provider === undefined
          ? currentOverride?.provider ?? null
          : payload.provider
            ? parseLlmProvider(payload.provider)
            : null;
      const nextModel =
        payload.model === undefined
          ? currentOverride?.model ?? null
          : payload.model?.trim() || null;

      const providerValue = nextProvider
        ? Prisma.sql`${nextProvider}::"LlmProvider"`
        : Prisma.sql`NULL`;
      await this.prisma.$executeRaw(
        Prisma.sql`
          UPDATE topic_agents
          SET
            provider = ${providerValue},
            model = ${nextModel}
          WHERE id = ${agentId}::uuid
        `,
      );
    }

    return (await this.findByTopicAndId(agent.topicId, agent.id))!;
  }

  async delete(agentId: string) {
    await this.prisma.topicAgent.delete({
      where: { id: agentId },
    });
  }

  async reorder(client: DbClient, topicId: string, agentIds: string[]) {
    await Promise.all(
      agentIds.map((agentId, index) =>
        client.topicAgent.updateMany({
          where: {
            id: agentId,
            topicId,
          },
          data: {
            sortOrder: index,
          },
        }),
      ),
    );
  }

  private async loadAgentOverride(agentId: string) {
    const rows = await this.prisma.$queryRaw<AgentOverrideRow[]>`
      SELECT
        id,
        provider,
        model
      FROM topic_agents
      WHERE id = ${agentId}::uuid
      LIMIT 1
    `;

    return rows[0] ?? null;
  }

  private async loadAgentOverridesByTopic(topicId: string) {
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
