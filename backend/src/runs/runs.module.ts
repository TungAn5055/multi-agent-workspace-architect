import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

import { AgentsModule } from 'src/agents/agents.module';
import { AuthModule } from 'src/auth/auth.module';
import { RUNS_QUEUE } from 'src/common/constants/app.constants';
import { MessagesRepository } from 'src/messages/messages.repository';
import { ObservabilityModule } from 'src/observability/observability.module';
import { RunsController } from 'src/runs/runs.controller';
import { RunExecutionRegistryService } from 'src/runs/run-execution-registry.service';
import { RunsRepository } from 'src/runs/runs.repository';
import { RunsService } from 'src/runs/runs.service';
import { StreamModule } from 'src/stream/stream.module';
import { TopicsModule } from 'src/topics/topics.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: RUNS_QUEUE,
    }),
    AuthModule,
    TopicsModule,
    AgentsModule,
    StreamModule,
    ObservabilityModule,
  ],
  controllers: [RunsController],
  providers: [RunsRepository, RunsService, RunExecutionRegistryService, MessagesRepository],
  exports: [RunsRepository, RunsService, RunExecutionRegistryService],
})
export class RunsModule {}
