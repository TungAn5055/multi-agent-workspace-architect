import { Controller, Param, Sse } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import { StreamService } from 'src/stream/stream.service';
import { TopicsService } from 'src/topics/topics.service';

@ApiTags('stream')
@Controller('topics/:topicId/stream')
export class StreamController {
  constructor(
    private readonly streamService: StreamService,
    private readonly topicsService: TopicsService,
  ) {}

  @Sse()
  async stream(@CurrentUserId() userId: string, @Param('topicId') topicId: string) {
    await this.topicsService.assertOwnedTopic(topicId, userId);
    return this.streamService.stream(topicId);
  }
}
