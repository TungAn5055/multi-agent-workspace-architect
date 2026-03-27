import { Injectable } from '@nestjs/common';

import { AppException } from 'src/common/exceptions/app.exception';
import { ERROR_CODES } from 'src/common/exceptions/error-codes';
import { ManagedLlmProvider } from 'src/config/app.config';
import { AppConfigService } from 'src/config/app-config.service';
import { MANAGED_LLM_PROVIDER_VALUES } from 'src/llm/llm.constants';
import { mapLlmProvider, parseLlmProvider } from 'src/llm/llm.mapper';
import { LlmRepository } from 'src/llm/llm.repository';
import { LlmCryptoService } from 'src/llm/llm-crypto.service';
import { LlmCredentialSource, LlmCredentialSummary } from 'src/llm/llm.types';

@Injectable()
export class LlmCredentialsService {
  constructor(
    private readonly repository: LlmRepository,
    private readonly crypto: LlmCryptoService,
    private readonly appConfig: AppConfigService,
  ) {}

  parseManagedProvider(provider: string): ManagedLlmProvider {
    if (!this.appConfig.isManagedLlmProvider(provider)) {
      throw new AppException({
        status: 400,
        code: ERROR_CODES.validationFailed,
        message: `Provider ${provider} không được hỗ trợ.`,
      });
    }

    return provider;
  }

  async listCredentialSummaries(userId: string): Promise<LlmCredentialSummary[]> {
    const records = await this.repository.listUserCredentials(userId);
    const recordByProvider = new Map<
      ManagedLlmProvider,
      { keyHint: string; updatedAt: Date }
    >(
      records.map((record: { provider: Parameters<typeof mapLlmProvider>[0]; keyHint: string; updatedAt: Date }) => [
        mapLlmProvider(record.provider),
        {
          keyHint: record.keyHint,
          updatedAt: record.updatedAt,
        },
      ]),
    );

    return MANAGED_LLM_PROVIDER_VALUES.map((provider) => {
      const record = recordByProvider.get(provider);
      if (record) {
        return {
          provider,
          isConfigured: true,
          source: 'saved',
          keyHint: record.keyHint,
          updatedAt: record.updatedAt.toISOString(),
        };
      }

      const envApiKey = this.appConfig.resolveProviderEnvApiKey(provider);
      return {
        provider,
        isConfigured: Boolean(envApiKey),
        source: envApiKey ? 'env' : 'none',
        keyHint: envApiKey ? this.buildKeyHint(envApiKey) : null,
        updatedAt: null,
      };
    });
  }

  async upsertCredential(userId: string, provider: ManagedLlmProvider, apiKey: string) {
    const normalizedKey = apiKey.trim();
    if (!normalizedKey) {
      throw new AppException({
        status: 400,
        code: ERROR_CODES.validationFailed,
        message: 'API key không được để trống.',
      });
    }

    const record = await this.repository.upsertUserCredential(
      userId,
      parseLlmProvider(provider),
      this.crypto.encrypt(normalizedKey),
      this.buildKeyHint(normalizedKey),
    );

    return {
      provider,
      isConfigured: true,
      source: 'saved' as const,
      keyHint: record.keyHint,
      updatedAt: record.updatedAt.toISOString(),
    };
  }

  async deleteCredential(userId: string, provider: ManagedLlmProvider) {
    await this.repository.deleteUserCredential(userId, parseLlmProvider(provider));

    const envApiKey = this.appConfig.resolveProviderEnvApiKey(provider);
    return {
      provider,
      deleted: true,
      fallbackSource: envApiKey ? ('env' as const) : ('none' as const),
      stillConfigured: Boolean(envApiKey),
    };
  }

  async resolveCredential(userId: string, provider: ManagedLlmProvider): Promise<{ apiKey: string; source: LlmCredentialSource }> {
    const record = await this.repository.findUserCredential(userId, parseLlmProvider(provider));
    if (record) {
      return {
        apiKey: this.crypto.decrypt(record.apiKeyEncrypted),
        source: 'saved',
      };
    }

    const envApiKey = this.appConfig.resolveProviderEnvApiKey(provider);
    if (envApiKey) {
      return {
        apiKey: envApiKey,
        source: 'env',
      };
    }

    throw new AppException({
      status: 409,
      code: ERROR_CODES.llmCredentialMissing,
      message: `Chưa có API key cho provider ${provider}. Hãy thêm key trong phần Settings trước khi chạy topic.`,
    });
  }

  async resolveOptionalCredential(userId: string, provider: ManagedLlmProvider) {
    try {
      return await this.resolveCredential(userId, provider);
    } catch (error) {
      if (error instanceof AppException && error.code === ERROR_CODES.llmCredentialMissing) {
        return null;
      }

      throw error;
    }
  }

  private buildKeyHint(apiKey: string) {
    if (apiKey.length <= 8) {
      return '*'.repeat(apiKey.length);
    }

    return `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}`;
  }
}
