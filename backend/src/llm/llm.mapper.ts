import { ManagedLlmProvider } from 'src/config/app.config';
import { MANAGED_LLM_PROVIDER_VALUES } from 'src/llm/llm.constants';

export function mapLlmProvider(provider: string): ManagedLlmProvider {
  const normalized = provider.toLocaleLowerCase('en-US');
  if (!MANAGED_LLM_PROVIDER_VALUES.includes(normalized as ManagedLlmProvider)) {
    throw new Error(`Unsupported LLM provider: ${provider}`);
  }

  return normalized as ManagedLlmProvider;
}

export function parseLlmProvider(provider: string): ManagedLlmProvider {
  return mapLlmProvider(provider);
}
