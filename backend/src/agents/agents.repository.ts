import { Injectable } from '@nestjs/common';

import { DbClient } from 'src/common/interfaces/db-client.interface';
import { normalizeAgentName } from 'src/common/utils/name-normalizer';
import { PrismaService } from 'src/prisma/prisma.service';
import { AddAgentDto } from 'src/agents/dto/add-agent.dto';
import { UpdateAgentDto } from 'src/agents/dto/update-agent.dto';

@Injectable()
export class AgentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listByTopic(topicId: string) {
    return this.prisma.topicAgent.findMany({
      where: { topicId },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findByTopicAndId(topicId: string, agentId: string) {
    return this.prisma.topicAgent.findFirst({
      where: {
        id: agentId,
        topicId,
      },
    });
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
    const lastAgent = await this.prisma.topicAgent.findFirst({
      where: { topicId },
      orderBy: { sortOrder: 'desc' },
    });

    return this.prisma.topicAgent.create({
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
  }

  async update(agentId: string, payload: UpdateAgentDto) {
    return this.prisma.topicAgent.update({
      where: { id: agentId },
      data: {
        name: payload.name?.trim(),
        nameNormalized: payload.name ? normalizeAgentName(payload.name) : undefined,
        role: payload.role ? (payload.role.toUpperCase() as never) : undefined,
        description: payload.description?.trim(),
        isEnabled: payload.isEnabled,
      },
    });
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
}
