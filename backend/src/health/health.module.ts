import { Module } from '@nestjs/common';

import { HealthController } from 'src/health/health.controller';
import { HealthService } from 'src/health/health.service';
import { RedisModule } from 'src/health/redis.module';

@Module({
  imports: [RedisModule],
  controllers: [HealthController],
  providers: [HealthService],
  exports: [RedisModule],
})
export class HealthModule {}
