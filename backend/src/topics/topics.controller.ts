import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import { toEnvelope } from 'src/common/dto/api-envelope.dto';
import { CreateTopicDto } from 'src/topics/dto/create-topic.dto';
import { UpdateTopicTitleDto } from 'src/topics/dto/update-topic-title.dto';
import { TopicsService } from 'src/topics/topics.service';

@ApiTags('topics')
@Controller('topics')
export class TopicsController {
  constructor(private readonly topicsService: TopicsService) {}

  @Post()
  async createTopic(@CurrentUserId() userId: string, @Body() payload: CreateTopicDto) {
    return toEnvelope(await this.topicsService.createTopic(userId, payload));
  }

  @Get()
  async listTopics(@CurrentUserId() userId: string) {
    return toEnvelope(await this.topicsService.listTopics(userId));
  }

  @Get(':topicId')
  async getTopicDetail(@CurrentUserId() userId: string, @Param('topicId') topicId: string) {
    return toEnvelope(await this.topicsService.getTopicDetail(topicId, userId));
  }

  @Patch(':topicId')
  async updateTopicTitle(
    @CurrentUserId() userId: string,
    @Param('topicId') topicId: string,
    @Body() payload: UpdateTopicTitleDto,
  ) {
    return toEnvelope(await this.topicsService.updateTopicTitle(topicId, userId, payload));
  }

  @Post(':topicId/archive')
  async archiveTopic(@CurrentUserId() userId: string, @Param('topicId') topicId: string) {
    return toEnvelope(await this.topicsService.archiveTopic(topicId, userId));
  }
}
