import { Global, Module } from '@nestjs/common';
import Redis from 'ioredis';

import { AppConfigService } from 'src/config/app-config.service';

export const REDIS_CLIENT = Symbol('REDIS_CLIENT');

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [AppConfigService],
      useFactory: (appConfig: AppConfigService) => {
        return new Redis(appConfig.redisUrl, {
          maxRetriesPerRequest: null,
        });
      },
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
