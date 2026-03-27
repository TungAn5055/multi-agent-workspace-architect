import { ManagedLlmProvider } from 'src/config/app.config';

export const MANAGED_LLM_PROVIDER_VALUES = ['openai', 'anthropic', 'openrouter'] as const satisfies readonly ManagedLlmProvider[];

export const MANAGED_LLM_PROVIDER_LABELS: Record<ManagedLlmProvider, string> = {
  anthropic: 'Claude / Anthropic',
  openai: 'OpenAI',
  openrouter: 'OpenRouter',
};

export interface LlmCatalogSuggestion {
  id: string;
  label: string;
  description: string;
  isFree?: boolean;
}

export const FALLBACK_LLM_CATALOGS: Record<ManagedLlmProvider, LlmCatalogSuggestion[]> = {
  openai: [
    {
      id: 'gpt-5',
      label: 'GPT-5',
      description: 'Model mặc định mạnh hơn cho reasoning và synthesis.',
    },
    {
      id: 'gpt-5-mini',
      label: 'GPT-5 Mini',
      description: 'Nhanh hơn, rẻ hơn cho agent phụ và tác vụ tổng quát.',
    },
    {
      id: 'gpt-4.1',
      label: 'GPT-4.1',
      description: 'Phù hợp nếu bạn vẫn muốn giữ line-up GPT-4.1 cho compatibility.',
    },
  ],
  anthropic: [
    {
      id: 'claude-sonnet-4-5',
      label: 'Claude Sonnet 4.5',
      description: 'Lựa chọn mặc định cân bằng cho viết, phân tích và debate.',
    },
    {
      id: 'claude-opus-4-1',
      label: 'Claude Opus 4.1',
      description: 'Model mạnh hơn cho step lead hoặc synthesis dài.',
    },
    {
      id: 'claude-haiku-4-5',
      label: 'Claude Haiku 4.5',
      description: 'Nhanh hơn cho agent phụ hoặc pass đầu.',
    },
  ],
  openrouter: [
    {
      id: 'openai/gpt-5-mini',
      label: 'GPT-5 Mini via OpenRouter',
      description: 'Fallback nếu catalog OpenRouter chưa tải được.',
    },
    {
      id: 'anthropic/claude-sonnet-4.5',
      label: 'Claude Sonnet 4.5 via OpenRouter',
      description: 'Fallback nếu catalog OpenRouter chưa tải được.',
    },
    {
      id: 'nvidia/nemotron-3-super-120b-a12b:free',
      label: 'Nemotron Free via OpenRouter',
      description: 'Biến thể free để dựng flow nhanh và rẻ.',
      isFree: true,
    },
  ],
};
