import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import { toEnvelope } from 'src/common/dto/api-envelope.dto';
import { GetMessagesQueryDto } from 'src/messages/dto/get-messages-query.dto';
import { PostHumanMessageDto } from 'src/messages/dto/post-human-message.dto';
import { MessagesService } from 'src/messages/messages.service';
import { RunsService } from 'src/runs/runs.service';

@ApiTags('messages')
@Controller('topics/:topicId/messages')
export class MessagesController {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly runsService: RunsService,
  ) {}

  @Get()
  async getMessages(
    @CurrentUserId() userId: string,
    @Param('topicId') topicId: string,
    @Query() query: GetMessagesQueryDto,
  ) {
    return toEnvelope(await this.messagesService.getTimeline(topicId, userId, query), {
      cursor: query.cursor ?? null,
      limit: query.limit,
    });
  }

  @Post()
  async postHumanMessage(
    @CurrentUserId() userId: string,
    @Param('topicId') topicId: string,
    @Body() payload: PostHumanMessageDto,
  ) {
    return toEnvelope(await this.runsService.createRunFromHumanMessage(topicId, userId, payload));
  }
}
