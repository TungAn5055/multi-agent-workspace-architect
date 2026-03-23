import { Global, Module } from '@nestjs/common';

import { ObservabilityService } from 'src/observability/observability.service';

@Global()
@Module({
  providers: [ObservabilityService],
  exports: [ObservabilityService],
})
export class ObservabilityModule {}
