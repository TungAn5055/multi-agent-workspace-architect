import { Injectable } from '@nestjs/common';

type CounterName = 'run_completed' | 'run_failed' | 'run_waiting_human' | 'run_cancelled';

@Injectable()
export class ObservabilityService {
  private readonly counters: Record<CounterName, number> = {
    run_completed: 0,
    run_failed: 0,
    run_waiting_human: 0,
    run_cancelled: 0,
  };

  increment(counter: CounterName) {
    this.counters[counter] += 1;
  }

  snapshot() {
    return { ...this.counters };
  }
}
