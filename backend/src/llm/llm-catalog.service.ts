import { Injectable, Logger } from '@nestjs/common';

import { ManagedLlmProvider } from 'src/config/app.config';
import { AppConfigService } from 'src/config/app-config.service';
import { FALLBACK_LLM_CATALOGS, MANAGED_LLM_PROVIDER_VALUES } from 'src/llm/llm.constants';
import { LlmCredentialsService } from 'src/llm/llm-credentials.service';
import { LlmCatalogItem, LlmProviderCatalog } from 'src/llm/llm.types';

interface OpenAiModelRecord {
  id: string;
  created?: number;
  owned_by?: string;
}

interface AnthropicModelRecord {
  id: string;
  display_name?: string;
  type?: string;
}

interface OpenRouterModelRecord {
  id: string;
  name?: string;
  description?: string;
  context_length?: number;
  pricing?: {
    prompt?: string;
    completion?: string;
  };
}

@Injectable()
export class LlmCatalogService {
  private readonly logger = new Logger(LlmCatalogService.name);

  constructor(
    private readonly appConfig: AppConfigService,
    private readonly credentials: LlmCredentialsService,
  ) {}

  async getAllCatalogs(userId: string): Promise<LlmProviderCatalog[]> {
    return Promise.all(MANAGED_LLM_PROVIDER_VALUES.map((provider) => this.getCatalog(userId, provider)));
  }

  async getCatalog(userId: string, provider: ManagedLlmProvider): Promise<LlmProviderCatalog> {
    switch (provider) {
      case 'anthropic':
        return this.getAnthropicCatalog(userId);
      case 'openai':
        return this.getOpenAiCatalog(userId);
      case 'openrouter':
        return this.getOpenRouterCatalog();
      default:
        return this.buildFallbackCatalog(provider);
    }
  }

  private async getOpenAiCatalog(userId: string): Promise<LlmProviderCatalog> {
    const credential = await this.credentials.resolveOptionalCredential(userId, 'openai');
    if (!credential) {
      return this.buildFallbackCatalog('openai');
    }

    try {
      const response = await this.fetchJson<{ data?: OpenAiModelRecord[] }>(
        `${this.appConfig.resolveProviderBaseUrl('openai').replace(/\/$/, '')}/models`,
        {
          headers: {
            authorization: `Bearer ${credential.apiKey}`,
          },
        },
      );

      const models = (response.data ?? [])
        .filter((model) => this.isOpenAiTextModel(model.id))
        .sort((left, right) => right.id.localeCompare(left.id, 'en-US'))
        .map<LlmCatalogItem>((model) => ({
          id: model.id,
          label: model.id,
          description: 'Model text/reasoning khả dụng từ OpenAI API.',
          contextLength: null,
          isFree: false,
        }));

      return {
        provider: 'openai',
        source: models.length > 0 ? 'live' : 'fallback',
        supportsCustomModel: true,
        models: models.length > 0 ? models : this.buildFallbackCatalog('openai').models,
      };
    } catch (error) {
      this.logger.warn(`OpenAI catalog fallback: ${error instanceof Error ? error.message : String(error)}`);
      return this.buildFallbackCatalog('openai');
    }
  }

  private async getAnthropicCatalog(userId: string): Promise<LlmProviderCatalog> {
    const credential = await this.credentials.resolveOptionalCredential(userId, 'anthropic');
    if (!credential) {
      return this.buildFallbackCatalog('anthropic');
    }

    try {
      const response = await this.fetchJson<{ data?: AnthropicModelRecord[] }>(
        `${this.appConfig.resolveProviderBaseUrl('anthropic').replace(/\/$/, '')}/models`,
        {
          headers: {
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
            'x-api-key': credential.apiKey,
          },
        },
      );

      const models = (response.data ?? [])
        .filter((model) => Boolean(model.id?.trim()))
        .sort((left, right) => left.id.localeCompare(right.id, 'en-US'))
        .map<LlmCatalogItem>((model) => ({
          id: model.id,
          label: model.display_name?.trim() || model.id,
          description: 'Model khả dụng từ Anthropic API.',
          contextLength: null,
          isFree: false,
        }));

      return {
        provider: 'anthropic',
        source: models.length > 0 ? 'live' : 'fallback',
        supportsCustomModel: true,
        models: models.length > 0 ? models : this.buildFallbackCatalog('anthropic').models,
      };
    } catch (error) {
      this.logger.warn(`Anthropic catalog fallback: ${error instanceof Error ? error.message : String(error)}`);
      return this.buildFallbackCatalog('anthropic');
    }
  }

  private async getOpenRouterCatalog(): Promise<LlmProviderCatalog> {
    try {
      const response = await this.fetchJson<{ data?: OpenRouterModelRecord[] }>(
        `${this.appConfig.resolveProviderBaseUrl('openrouter').replace(/\/$/, '')}/models`,
      );

      const models = (response.data ?? [])
        .filter((model) => Boolean(model.id?.trim()))
        .sort((left, right) => {
          const freeDelta = Number(this.isFreeOpenRouterModel(right)) - Number(this.isFreeOpenRouterModel(left));
          if (freeDelta !== 0) {
            return freeDelta;
          }

          return (left.name ?? left.id).localeCompare(right.name ?? right.id, 'en-US');
        })
        .map<LlmCatalogItem>((model) => ({
          id: model.id,
          label: model.name?.trim() || model.id,
          description: model.description?.trim() || 'Model khả dụng qua OpenRouter.',
          contextLength: model.context_length ?? null,
          isFree: this.isFreeOpenRouterModel(model),
        }));

      return {
        provider: 'openrouter',
        source: models.length > 0 ? 'live' : 'fallback',
        supportsCustomModel: true,
        models: models.length > 0 ? models : this.buildFallbackCatalog('openrouter').models,
      };
    } catch (error) {
      this.logger.warn(`OpenRouter catalog fallback: ${error instanceof Error ? error.message : String(error)}`);
      return this.buildFallbackCatalog('openrouter');
    }
  }

  private buildFallbackCatalog(provider: ManagedLlmProvider): LlmProviderCatalog {
    return {
      provider,
      source: 'fallback',
      supportsCustomModel: true,
      models: FALLBACK_LLM_CATALOGS[provider].map((model) => ({
        id: model.id,
        label: model.label,
        description: model.description,
        contextLength: null,
        isFree: Boolean(model.isFree),
      })),
    };
  }

  private isOpenAiTextModel(modelId: string) {
    const normalized = modelId.toLocaleLowerCase('en-US');
    if (
      normalized.includes('audio') ||
      normalized.includes('realtime') ||
      normalized.includes('transcribe') ||
      normalized.includes('tts') ||
      normalized.includes('embedding') ||
      normalized.includes('image') ||
      normalized.includes('moderation') ||
      normalized.includes('whisper')
    ) {
      return false;
    }

    return (
      normalized.startsWith('gpt') ||
      normalized.startsWith('o1') ||
      normalized.startsWith('o3') ||
      normalized.startsWith('o4') ||
      normalized.startsWith('chatgpt') ||
      normalized.startsWith('codex')
    );
  }

  private isFreeOpenRouterModel(model: OpenRouterModelRecord) {
    if (model.id.endsWith(':free')) {
      return true;
    }

    const promptPrice = Number(model.pricing?.prompt ?? '1');
    const completionPrice = Number(model.pricing?.completion ?? '1');
    return promptPrice === 0 && completionPrice === 0;
  }

  private async fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
    const response = await fetch(url, {
      ...init,
      headers: {
        accept: 'application/json',
        ...(init?.headers ?? {}),
      },
    });

    if (!response.ok) {
      throw new Error(`Catalog request failed (${response.status})`);
    }

    return (await response.json()) as T;
  }
}
