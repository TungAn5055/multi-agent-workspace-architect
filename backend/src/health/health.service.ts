import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';

import { AppConfigService } from 'src/config/app-config.service';
import { ObservabilityService } from 'src/observability/observability.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { REDIS_CLIENT } from 'src/health/redis.module';

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly appConfig: AppConfigService,
    private readonly observability: ObservabilityService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async getHealth() {
    await this.prisma.$queryRaw`SELECT 1`;
    const redisPong = await this.redis.ping();

    return {
      status: 'ok',
      app: {
        baseUrl: this.appConfig.baseUrl,
        defaultUserId: this.appConfig.defaultUserId,
      },
      database: 'ok',
      redis: redisPong === 'PONG' ? 'ok' : 'degraded',
      counters: this.observability.snapshot(),
      timestamp: new Date().toISOString(),
    };
  }
}
