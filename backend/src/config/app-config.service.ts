import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { LlmProvider, ManagedLlmProvider } from 'src/config/app.config';

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

  get llmCredentialsSecret(): string {
    return this.configService.get<string>('app.llmCredentialsSecret') ?? '';
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

  get openaiApiKey(): string {
    return this.configService.get<string>('app.openaiApiKey') ?? '';
  }

  get openaiBaseUrl(): string {
    return this.configService.get<string>('app.openaiBaseUrl') ?? '';
  }

  get openaiModel(): string {
    return this.configService.get<string>('app.openaiModel') ?? 'gpt-5';
  }

  get anthropicApiKey(): string {
    return this.configService.get<string>('app.anthropicApiKey') ?? '';
  }

  get anthropicBaseUrl(): string {
    return this.configService.get<string>('app.anthropicBaseUrl') ?? 'https://api.anthropic.com/v1';
  }

  get anthropicModel(): string {
    return this.configService.get<string>('app.anthropicModel') ?? 'claude-sonnet-4-5';
  }

  get openrouterApiKey(): string {
    return this.configService.get<string>('app.openrouterApiKey') ?? '';
  }

  get openrouterBaseUrl(): string {
    return this.configService.get<string>('app.openrouterBaseUrl') ?? '';
  }

  get openrouterModel(): string {
    return this.configService.get<string>('app.openrouterModel') ?? '';
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

  get defaultManagedLlmProvider(): ManagedLlmProvider {
    return this.llmProvider === 'nvidia' ? 'openrouter' : this.llmProvider;
  }

  isManagedLlmProvider(value: string | null | undefined): value is ManagedLlmProvider {
    return value === 'anthropic' || value === 'openai' || value === 'openrouter';
  }

  resolveManagedProvider(provider?: string | null, model?: string | null): ManagedLlmProvider {
    if (this.isManagedLlmProvider(provider)) {
      return provider;
    }

    const normalizedModel = model?.trim().toLocaleLowerCase('en-US') ?? '';
    if (!normalizedModel) {
      return this.defaultManagedLlmProvider;
    }

    if (normalizedModel.startsWith('claude') || normalizedModel.startsWith('anthropic/')) {
      return 'anthropic';
    }

    if (normalizedModel.endsWith(':free') || normalizedModel.includes('/')) {
      return 'openrouter';
    }

    if (normalizedModel.startsWith('gpt') || normalizedModel.startsWith('o1') || normalizedModel.startsWith('o3')) {
      return 'openai';
    }

    return this.defaultManagedLlmProvider;
  }

  resolveLlmModel(provider: ManagedLlmProvider | LlmProvider, model?: string | null): string {
    const requestedModel = model?.trim();
    if (provider === 'anthropic') {
      return requestedModel || this.anthropicModel;
    }

    if (provider === 'openrouter') {
      return requestedModel || this.openrouterModel || this.llmModel;
    }

    if (provider === 'nvidia') {
      if (requestedModel?.startsWith('nvidia/')) {
        return requestedModel;
      }
      return requestedModel || this.llmModel;
    }

    return requestedModel || this.openaiModel || this.llmModel;
  }

  resolveProviderBaseUrl(provider: ManagedLlmProvider | LlmProvider): string {
    if (provider === 'anthropic') {
      return this.anthropicBaseUrl;
    }

    if (provider === 'openrouter') {
      return this.openrouterBaseUrl || this.llmBaseUrl;
    }

    if (provider === 'nvidia') {
      return this.llmBaseUrl;
    }

    return this.openaiBaseUrl;
  }

  resolveProviderEnvApiKey(provider: ManagedLlmProvider | LlmProvider): string {
    if (provider === 'anthropic') {
      return this.anthropicApiKey || (this.llmProvider === 'anthropic' ? this.llmApiKey : '');
    }

    if (provider === 'openrouter') {
      return this.openrouterApiKey || (this.llmProvider === 'openrouter' ? this.llmApiKey : '');
    }

    if (provider === 'nvidia') {
      return this.llmProvider === 'nvidia' ? this.llmApiKey : '';
    }

    return this.openaiApiKey || (this.llmProvider === 'openai' ? this.llmApiKey : '');
  }

  private getOrThrow<T>(key: string): T {
    const value = this.configService.get<T>(key);
    if (value === undefined || value === null || value === '') {
      throw new Error(`Missing configuration value: ${key}`);
    }
    return value;
  }
}
