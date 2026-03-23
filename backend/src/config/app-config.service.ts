import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { LlmProvider } from 'src/config/app.config';

@Injectable()
export class AppConfigService {
  constructor(private readonly configService: ConfigService) {}

  get llmProvider(): LlmProvider {
    return this.getOrThrow<LlmProvider>('app.llmProvider');
  }

  get host(): string {
    return this.getOrThrow<string>('app.host');
  }

  get port(): number {
    return this.getOrThrow<number>('app.port');
  }

  get baseUrl(): string {
    return this.getOrThrow<string>('app.baseUrl');
  }

  get defaultUserId(): string {
    return this.getOrThrow<string>('app.defaultUserId');
  }

  get sseHeartbeatMs(): number {
    return this.getOrThrow<number>('app.sseHeartbeatMs');
  }

  get databaseUrl(): string {
    return this.getOrThrow<string>('app.databaseUrl');
  }

  get redisUrl(): string {
    return this.getOrThrow<string>('app.redisUrl');
  }

  get llmApiKey(): string {
    return this.configService.get<string>('app.llmApiKey') ?? '';
  }

  get llmBaseUrl(): string {
    return this.configService.get<string>('app.llmBaseUrl') ?? '';
  }

  get llmModel(): string {
    return this.getOrThrow<string>('app.llmModel');
  }

  get llmModelOverride(): string {
    return this.configService.get<string>('app.llmModelOverride') ?? '';
  }

  get llmTimeoutMs(): number {
    return this.getOrThrow<number>('app.llmTimeoutMs');
  }

  get llmMaxRetries(): number {
    return this.getOrThrow<number>('app.llmMaxRetries');
  }

  get llmAppUrl(): string {
    return this.configService.get<string>('app.llmAppUrl') ?? '';
  }

  get llmAppName(): string {
    return this.configService.get<string>('app.llmAppName') ?? '';
  }

  get orchestratorMaxParticipants(): number {
    return this.getOrThrow<number>('app.orchestratorMaxParticipants');
  }

  get orchestratorMaxRecentMessages(): number {
    return this.getOrThrow<number>('app.orchestratorMaxRecentMessages');
  }

  get queueRunAttempts(): number {
    return this.getOrThrow<number>('app.queueRunAttempts');
  }

  resolveLlmModel(model?: string | null): string {
    const requestedModel = model?.trim();
    if (this.llmModelOverride) {
      return this.llmModel;
    }

    const configuredBaseModel = this.stripModelVariant(this.llmModel);

    if (this.llmProvider === 'nvidia') {
      if (requestedModel?.startsWith('nvidia/')) {
        return requestedModel;
      }
      return this.llmModel;
    }

    if (this.llmProvider === 'openrouter') {
      if (!requestedModel || !requestedModel.includes('/')) {
        return this.llmModel;
      }

      if (this.stripModelVariant(requestedModel) === configuredBaseModel) {
        return this.llmModel;
      }

      return requestedModel;
    }

    return requestedModel || this.llmModel;
  }

  private stripModelVariant(model: string): string {
    return model.split(':', 1)[0] ?? model;
  }

  private getOrThrow<T>(key: string): T {
    const value = this.configService.get<T>(key);
    if (value === undefined || value === null || value === '') {
      throw new Error(`Missing configuration value: ${key}`);
    }
    return value;
  }
}
