import { Injectable } from '@nestjs/common';

import { AppException } from 'src/common/exceptions/app.exception';
import { ERROR_CODES } from 'src/common/exceptions/error-codes';
import { mapAgentRole, mapLlmProvider } from 'src/topics/topics.mapper';
import { TopicsService } from 'src/topics/topics.service';
import { TopicsRepository } from 'src/topics/topics.repository';
import { AddAgentDto } from 'src/agents/dto/add-agent.dto';
import { ReorderAgentsDto } from 'src/agents/dto/reorder-agents.dto';
import { UpdateAgentDto } from 'src/agents/dto/update-agent.dto';
import { AgentsRepository } from 'src/agents/agents.repository';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AgentsService {
  constructor(
    private readonly agentsRepository: AgentsRepository,
    private readonly topicsService: TopicsService,
    private readonly topicsRepository: TopicsRepository,
    private readonly prisma: PrismaService,
  ) {}

  async addAgent(topicId: string, userId: string, payload: AddAgentDto) {
    await this.assertTopicCanMutateAgents(topicId, userId);
    this.assertProviderModelOverride(payload);

    if (await this.agentsRepository.hasDuplicateName(topicId, payload.name)) {
      throw new AppException({
        status: 409,
        code: ERROR_CODES.agentNameDuplicated,
        message: 'Tên agent trong cùng topic không được trùng nhau.',
      });
    }

    const agent = await this.agentsRepository.create(topicId, payload);
    return this.mapAgent(agent);
  }

  async updateAgent(topicId: string, agentId: string, userId: string, payload: UpdateAgentDto) {
    await this.assertTopicCanMutateAgents(topicId, userId);
    const agent = await this.agentsRepository.findByTopicAndId(topicId, agentId);
    if (!agent) {
      throw new AppException({
        status: 404,
        code: ERROR_CODES.topicNotFound,
        message: 'Không tìm thấy agent.',
      });
    }

    this.assertProviderModelOverride(payload);

    if (payload.name && (await this.agentsRepository.hasDuplicateName(topicId, payload.name, agentId))) {
      throw new AppException({
        status: 409,
        code: ERROR_CODES.agentNameDuplicated,
        message: 'Tên agent trong cùng topic không được trùng nhau.',
      });
    }

    return this.mapAgent(await this.agentsRepository.update(agentId, payload));
  }

  async deleteAgent(topicId: string, agentId: string, userId: string) {
    await this.assertTopicCanMutateAgents(topicId, userId);

    const agents = await this.agentsRepository.listByTopic(topicId);
    if (agents.length <= 2) {
      throw new AppException({
        status: 400,
        code: ERROR_CODES.validationFailed,
        message: 'Topic phải giữ tối thiểu 2 agent.',
      });
    }

    const agent = await this.agentsRepository.findByTopicAndId(topicId, agentId);
    if (!agent) {
      throw new AppException({
        status: 404,
        code: ERROR_CODES.topicNotFound,
        message: 'Không tìm thấy agent.',
      });
    }

    await this.agentsRepository.delete(agentId);
    return { id: agentId, deleted: true };
  }

  async reorderAgents(topicId: string, userId: string, payload: ReorderAgentsDto) {
    await this.assertTopicCanMutateAgents(topicId, userId);
    const agents = await this.agentsRepository.listByTopic(topicId);
    const existingIds = new Set(agents.map((agent) => agent.id));

    if (payload.agentIds.length !== agents.length || payload.agentIds.some((id) => !existingIds.has(id))) {
      throw new AppException({
        status: 400,
        code: ERROR_CODES.validationFailed,
        message: 'Danh sách reorder agent không hợp lệ.',
      });
    }

    await this.prisma.$transaction(async (tx) => {
      await this.agentsRepository.reorder(tx, topicId, payload.agentIds);
    });

    return (await this.agentsRepository.listByTopic(topicId)).map((agent) => this.mapAgent(agent));
  }

  async assertTopicCanMutateAgents(topicId: string, userId: string) {
    const topic = await this.topicsService.assertOwnedTopic(topicId, userId);
    if (topic.status === 'ARCHIVED') {
      throw new AppException({
        status: 409,
        code: ERROR_CODES.topicArchived,
        message: 'Topic đã archive nên không thể chỉnh sửa agent.',
      });
    }

    const hasHistory = await this.topicsRepository.hasHistory(topicId);
    if (hasHistory) {
      throw new AppException({
        status: 409,
        code: ERROR_CODES.topicHistoryLocked,
        message: 'Topic đã có lịch sử chat, prompt agent không thể chỉnh sửa nữa.',
      });
    }
  }

  private mapAgent(agent: {
    id: string;
    name: string;
    role: Parameters<typeof mapAgentRole>[0];
    provider: Parameters<typeof mapLlmProvider>[0] | null;
    model: string | null;
    description: string;
    sortOrder: number;
    isEnabled: boolean;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: agent.id,
      name: agent.name,
      role: mapAgentRole(agent.role),
      provider: agent.provider ? mapLlmProvider(agent.provider) : null,
      model: agent.model ?? null,
      description: agent.description,
      sortOrder: agent.sortOrder,
      isEnabled: agent.isEnabled,
      createdAt: agent.createdAt.toISOString(),
      updatedAt: agent.updatedAt.toISOString(),
    };
  }

  private assertProviderModelOverride(payload: { provider?: string; model?: string }) {
    if (payload.provider && !payload.model) {
      throw new AppException({
        status: 400,
        code: ERROR_CODES.validationFailed,
        message: 'Nếu chọn provider override cho agent thì phải đi kèm model.',
      });
    }
  }
}
