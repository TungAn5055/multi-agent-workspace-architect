import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import { toEnvelope } from 'src/common/dto/api-envelope.dto';
import { CancelRunDto } from 'src/runs/dto/cancel-run.dto';
import { RunsService } from 'src/runs/runs.service';

@ApiTags('runs')
@Controller('topics/:topicId/runs')
export class RunsController {
  constructor(private readonly runsService: RunsService) {}

  @Get(':runId')
  async getRunDetail(
    @CurrentUserId() userId: string,
    @Param('topicId') topicId: string,
    @Param('runId') runId: string,
  ) {
    return toEnvelope(await this.runsService.getRunDetail(topicId, runId, userId));
  }

  @Post(':runId/cancel')
  async cancelRun(
    @CurrentUserId() userId: string,
    @Param('topicId') topicId: string,
    @Param('runId') runId: string,
    @Body() payload: CancelRunDto,
  ) {
    return toEnvelope(await this.runsService.cancelRun(topicId, runId, userId, payload));
  }
}
