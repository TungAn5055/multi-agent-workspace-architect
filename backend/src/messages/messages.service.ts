import { Injectable } from '@nestjs/common';

import { mapMessageStatus, mapSenderType } from 'src/topics/topics.mapper';
import { TopicsService } from 'src/topics/topics.service';
import { GetMessagesQueryDto } from 'src/messages/dto/get-messages-query.dto';
import { MessagesRepository } from 'src/messages/messages.repository';

@Injectable()
export class MessagesService {
  constructor(
    private readonly messagesRepository: MessagesRepository,
    private readonly topicsService: TopicsService,
  ) {}

  async getTimeline(topicId: string, userId: string, query: GetMessagesQueryDto) {
    await this.topicsService.assertOwnedTopic(topicId, userId);
    const result = await this.messagesRepository.listTimeline(topicId, query.limit, query.cursor);

    return {
      items: result.items.map((message) => ({
        id: message.id,
        topicId: message.topicId,
        runId: message.runId,
        senderType: mapSenderType(message.senderType),
        senderAgentId: message.senderAgentId,
        senderName: message.senderName,
        contentMarkdown: message.contentMarkdown,
        mentions: Array.isArray(message.mentionsJson) ? message.mentionsJson : [],
        status: mapMessageStatus(message.status),
        sequenceNo: message.sequenceNo,
        createdAt: message.createdAt.toISOString(),
        updatedAt: message.updatedAt.toISOString(),
      })),
      nextCursor: result.nextCursor,
    };
  }
}
