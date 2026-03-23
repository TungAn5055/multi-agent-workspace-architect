import { Injectable } from '@nestjs/common';

@Injectable()
export class RunExecutionRegistryService {
  private readonly controllers = new Map<string, AbortController>();

  register(runId: string, controller: AbortController) {
    this.controllers.set(runId, controller);
  }

  abort(runId: string) {
    this.controllers.get(runId)?.abort();
  }

  unregister(runId: string) {
    this.controllers.delete(runId);
  }
}
