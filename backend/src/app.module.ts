import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

import { AuthModule } from 'src/auth/auth.module';
import { AppConfigService } from 'src/config/app-config.service';
import { AppConfigModule } from 'src/config/config.module';
import { RequestContextMiddleware } from 'src/config/request-context.middleware';
import { HealthModule } from 'src/health/health.module';
import { ObservabilityModule } from 'src/observability/observability.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { TopicsModule } from 'src/topics/topics.module';
import { AgentsModule } from 'src/agents/agents.module';
import { LlmModule } from 'src/llm/llm.module';
import { MessagesModule } from 'src/messages/messages.module';
import { RunsModule } from 'src/runs/runs.module';
import { StreamModule } from 'src/stream/stream.module';
import { LlmGatewayModule } from 'src/llm-gateway/llm-gateway.module';
import { OrchestratorModule } from 'src/orchestrator/orchestrator.module';

@Module({
  imports: [
    AppConfigModule,
    BullModule.forRootAsync({
      inject: [AppConfigService],
      useFactory: (appConfig: AppConfigService) => ({
        connection: {
          url: appConfig.redisUrl,
        },
      }),
    }),
    PrismaModule,
    AuthModule,
    ObservabilityModule,
    HealthModule,
    LlmModule,
    TopicsModule,
    AgentsModule,
    MessagesModule,
    RunsModule,
    StreamModule,
    LlmGatewayModule,
    OrchestratorModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
