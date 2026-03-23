import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

import { AgentsModule } from 'src/agents/agents.module';
import { RUNS_QUEUE } from 'src/common/constants/app.constants';
import { LlmGatewayModule } from 'src/llm-gateway/llm-gateway.module';
import { MessagesModule } from 'src/messages/messages.module';
import { ObservabilityModule } from 'src/observability/observability.module';
import { OrchestratorProcessor } from 'src/orchestrator/orchestrator.processor';
import { OrchestratorService } from 'src/orchestrator/orchestrator.service';
import { ParticipantSelectorService } from 'src/orchestrator/participant-selector.service';
import { PromptBuilderService } from 'src/orchestrator/prompt-builder.service';
import { RunsModule } from 'src/runs/runs.module';
import { StreamModule } from 'src/stream/stream.module';
import { TopicsModule } from 'src/topics/topics.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: RUNS_QUEUE,
    }),
    TopicsModule,
    AgentsModule,
    MessagesModule,
    RunsModule,
    StreamModule,
    LlmGatewayModule,
    ObservabilityModule,
  ],
  providers: [
    ParticipantSelectorService,
    PromptBuilderService,
    OrchestratorService,
    OrchestratorProcessor,
  ],
})
export class OrchestratorModule {}
