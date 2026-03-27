import { ManagedLlmProvider } from '@/types/llm';
import { AgentRole } from '@/types/topic';

export const AGENT_ROLE_OPTIONS: Array<{
  value: AgentRole;
  label: string;
  hint: string;
}> = [
  {
    value: 'lead',
    label: 'Lead',
    hint: 'Tổng hợp, điều phối và là người duy nhất có thể hỏi ngược Human.',
  },
  {
    value: 'assistant',
    label: 'Assistant',
    hint: 'Mở đầu, triển khai ý chính và giữ nhịp thảo luận.',
  },
  {
    value: 'researcher',
    label: 'Researcher',
    hint: 'Đào sâu giả định, rủi ro và chi tiết cần làm rõ.',
  },
  {
    value: 'critic',
    label: 'Critic',
    hint: 'Phản biện, soi khoảng trống và chặn kết luận non.',
  },
];

export const LLM_PROVIDER_OPTIONS: Array<{
  value: ManagedLlmProvider;
  label: string;
  hint: string;
}> = [
  {
    value: 'openrouter',
    label: 'OpenRouter',
    hint: 'Một key để route nhiều model khác nhau, kể cả các biến thể free.',
  },
  {
    value: 'openai',
    label: 'OpenAI',
    hint: 'Dùng key trực tiếp của OpenAI cho line model GPT riêng.',
  },
  {
    value: 'anthropic',
    label: 'Claude / Anthropic',
    hint: 'Dùng key trực tiếp của Claude cho các model Anthropic.',
  },
];

export const DEFAULT_PROVIDER_MODELS: Record<ManagedLlmProvider, string> = {
  anthropic: 'claude-sonnet-4-5',
  openai: 'gpt-5',
  openrouter: 'nvidia/nemotron-3-super-120b-a12b:free',
};

export function getProviderLabel(provider: ManagedLlmProvider) {
  return LLM_PROVIDER_OPTIONS.find((option) => option.value === provider)?.label ?? provider;
}

export function getProviderHint(provider: ManagedLlmProvider) {
  return LLM_PROVIDER_OPTIONS.find((option) => option.value === provider)?.hint ?? provider;
}

export function getProviderModelListId(provider: ManagedLlmProvider) {
  return `provider-models-${provider}`;
}
