export type ManagedLlmProvider = 'anthropic' | 'openai' | 'openrouter';
export type LlmCredentialSource = 'env' | 'none' | 'saved';
export type LlmCatalogSource = 'fallback' | 'live';

export interface LlmCredentialSummary {
  provider: ManagedLlmProvider;
  isConfigured: boolean;
  source: LlmCredentialSource;
  keyHint: string | null;
  updatedAt: string | null;
}

export interface LlmCatalogItem {
  id: string;
  label: string;
  description: string;
  contextLength: number | null;
  isFree: boolean;
}

export interface LlmProviderCatalog {
  provider: ManagedLlmProvider;
  source: LlmCatalogSource;
  supportsCustomModel: boolean;
  models: LlmCatalogItem[];
}

export interface UpsertLlmCredentialPayload {
  apiKey: string;
}
