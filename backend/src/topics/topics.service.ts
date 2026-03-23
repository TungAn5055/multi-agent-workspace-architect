import { Injectable } from '@nestjs/common';
import { TopicStatus } from '@prisma/client';

import { OwnershipService } from 'src/auth/ownership.service';
import { MIN_TOPIC_AGENTS } from 'src/common/constants/app.constants';
import { AppException } from 'src/common/exceptions/app.exception';
import { ERROR_CODES } from 'src/common/exceptions/error-codes';
import { AppConfigService } from 'src/config/app-config.service';
import { mapAgentRole, mapRunStatus, mapTopicStatus } from 'src/topics/topics.mapper';
import { CreateTopicDto } from 'src/topics/dto/create-topic.dto';
import { UpdateTopicTitleDto } from 'src/topics/dto/update-topic-title.dto';
import { TopicsRepository } from 'src/topics/topics.repository';

@Injectable()
export class TopicsService {
  constructor(
    private readonly topicsRepository: TopicsRepository,
    private readonly ownershipService: OwnershipService,
    private readonly appConfig: AppConfigService,
  ) {}

  async createTopic(userId: string, payload: CreateTopicDto) {
    if (payload.agents.length < MIN_TOPIC_AGENTS) {
      throw new AppException({
        status: 400,
        code: ERROR_CODES.validationFailed,
        message: `Topic phải có ít nhất ${MIN_TOPIC_AGENTS} agent.`,
      });
    }

    const normalizedNames = payload.agents.map((agent) => agent.name.trim().toLocaleLowerCase('vi-VN'));
    if (new Set(normalizedNames).size !== normalizedNames.length) {
      throw new AppException({
        status: 409,
        code: ERROR_CODES.agentNameDuplicated,
        message: 'Tên agent trong cùng topic không được trùng nhau.',
      });
    }

    const topic = await this.topicsRepository.createTopic(
      userId,
      payload,
      this.appConfig.resolveLlmModel(payload.model),
    );

    return this.mapTopicDetail(topic, false);
  }

  async listTopics(userId: string) {
    const topics = await this.topicsRepository.listOwnedTopics(userId);

    return topics.map((topic) => ({
      id: topic.id,
      title: topic.title,
      status: mapTopicStatus(topic.status),
      sharedModel: this.appConfig.resolveLlmModel(topic.sharedModel),
      agentCount: topic._count.agents,
      hasHistory: topic._count.messages > 0,
      latestRunStatus: topic.runs[0] ? mapRunStatus(topic.runs[0].status) : null,
      updatedAt: topic.updatedAt.toISOString(),
      createdAt: topic.createdAt.toISOString(),
    }));
  }

  async getTopicDetail(topicId: string, userId: string) {
    const topic = await this.topicsRepository.findOwnedTopicDetail(topicId, userId);
    if (!topic) {
      throw new AppException({
        status: 404,
        code: ERROR_CODES.topicNotFound,
        message: 'Không tìm thấy topic.',
      });
    }

    return this.mapTopicDetail(topic, topic._count.messages > 0);
  }

  async updateTopicTitle(topicId: string, userId: string, payload: UpdateTopicTitleDto) {
    await this.assertOwnedTopic(topicId, userId);
    const topic = await this.topicsRepository.updateTitle(topicId, payload.title);

    return {
      id: topic.id,
      title: topic.title,
      status: mapTopicStatus(topic.status),
      updatedAt: topic.updatedAt.toISOString(),
    };
  }

  async archiveTopic(topicId: string, userId: string) {
    await this.assertOwnedTopic(topicId, userId);
    const topic = await this.topicsRepository.archive(topicId);

    return {
      id: topic.id,
      status: mapTopicStatus(topic.status),
      archivedAt: topic.updatedAt.toISOString(),
    };
  }

  async assertOwnedTopic(topicId: string, userId: string) {
    const topic = await this.topicsRepository.findOwnedTopic(topicId, userId);
    if (!topic) {
      throw new AppException({
        status: 404,
        code: ERROR_CODES.topicNotFound,
        message: 'Không tìm thấy topic.',
      });
    }

    this.ownershipService.assertOwner(topic.userId, userId);
    return topic;
  }

  private mapTopicDetail(
    topic: {
      id: string;
      title: string;
      status: TopicStatus;
      sharedModel: string;
      createdAt: Date;
      updatedAt: Date;
      firstMessageAt: Date | null;
      agents: Array<{
        id: string;
        name: string;
        role: Parameters<typeof mapAgentRole>[0];
        description: string;
        sortOrder: number;
        isEnabled: boolean;
        createdAt: Date;
        updatedAt: Date;
      }>;
      runs?: Array<{ id: string; status: Parameters<typeof mapRunStatus>[0]; createdAt: Date }>;
    },
    hasHistory: boolean,
  ) {
    return {
      id: topic.id,
      title: topic.title,
      status: mapTopicStatus(topic.status),
      sharedModel: this.appConfig.resolveLlmModel(topic.sharedModel),
      hasHistory,
      firstMessageAt: topic.firstMessageAt?.toISOString() ?? null,
      createdAt: topic.createdAt.toISOString(),
      updatedAt: topic.updatedAt.toISOString(),
      activeRun: topic.runs?.[0]
        ? {
            id: topic.runs[0].id,
            status: mapRunStatus(topic.runs[0].status),
            createdAt: topic.runs[0].createdAt.toISOString(),
          }
        : null,
      agents: topic.agents.map((agent) => ({
        id: agent.id,
        name: agent.name,
        role: mapAgentRole(agent.role),
        description: agent.description,
        sortOrder: agent.sortOrder,
        isEnabled: agent.isEnabled,
        createdAt: agent.createdAt.toISOString(),
        updatedAt: agent.updatedAt.toISOString(),
      })),
    };
  }
}
