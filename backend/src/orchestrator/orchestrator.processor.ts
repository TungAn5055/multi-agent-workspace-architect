import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

import { RUNS_QUEUE } from 'src/common/constants/app.constants';
import { OrchestratorService } from 'src/orchestrator/orchestrator.service';

@Processor(RUNS_QUEUE)
export class OrchestratorProcessor extends WorkerHost {
  constructor(private readonly orchestratorService: OrchestratorService) {
    super();
  }

  async process(job: Job<{ runId: string; topicId: string; triggerMessageId: string }>) {
    await this.orchestratorService.process(job);
  }
}
