import { registerAs } from '@nestjs/config';

export type LlmProvider = 'openai' | 'anthropic' | 'nvidia' | 'openrouter';
export type ManagedLlmProvider = Exclude<LlmProvider, 'nvidia'>;

const DEFAULT_OPENAI_BASE_URL = 'https://api.openai.com/v1';
const DEFAULT_ANTHROPIC_BASE_URL = 'https://api.anthropic.com/v1';
const DEFAULT_NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';
const DEFAULT_NVIDIA_MODEL = 'nvidia/nemotron-3-super-120b-a12b';
const DEFAULT_OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
const DEFAULT_OPENROUTER_MODEL = 'nvidia/nemotron-3-super-120b-a12b:free';
const DEFAULT_ANTHROPIC_MODEL = 'claude-sonnet-4-5';

function firstNonEmpty(...values: Array<string | undefined>): string {
  return values.find((value) => value?.trim())?.trim() ?? '';
}

function resolveConfiguredModelOverride(): string {
  return firstNonEmpty(
    process.env.OPENAI_MODEL,
    process.env.ANTHROPIC_MODEL,
    process.env.NVIDIA_MODEL,
    process.env.OPENROUTER_MODEL,
    process.env.LLM_MODEL,
  );
}

function resolveLlmProvider(): LlmProvider {
  const configuredProvider = firstNonEmpty(process.env.LLM_PROVIDER).toLowerCase();
  if (
    configuredProvider === 'anthropic' ||
    configuredProvider === 'nvidia' ||
    configuredProvider === 'openai' ||
    configuredProvider === 'openrouter'
  ) {
    return configuredProvider;
  }

  const model = firstNonEmpty(
    process.env.LLM_MODEL,
    process.env.OPENROUTER_MODEL,
    process.env.NVIDIA_MODEL,
    process.env.OPENAI_MODEL,
    process.env.ANTHROPIC_MODEL,
  ).toLowerCase();
  const baseUrl = firstNonEmpty(
    process.env.LLM_BASE_URL,
    process.env.OPENROUTER_BASE_URL,
    process.env.NVIDIA_BASE_URL,
    process.env.OPENAI_BASE_URL,
    process.env.ANTHROPIC_BASE_URL,
  ).toLowerCase();

  if (
    process.env.OPENROUTER_API_KEY ||
    process.env.OPENROUTER_MODEL ||
    model.endsWith(':free') ||
    baseUrl.includes('openrouter.ai')
  ) {
    return 'openrouter';
  }

  if (process.env.NVIDIA_API_KEY || model.startsWith('nvidia/') || baseUrl.includes('nvidia.com')) {
    return 'nvidia';
  }

  if (process.env.ANTHROPIC_API_KEY || model.startsWith('claude') || baseUrl.includes('anthropic.com')) {
    return 'anthropic';
  }

  return 'openai';
}

export const appConfig = registerAs('app', () => ({
  llmProvider: resolveLlmProvider(),
  host: process.env.APP_HOST ?? '0.0.0.0',
  port: Number(process.env.APP_PORT ?? 3001),
  baseUrl: process.env.APP_BASE_URL ?? 'http://localhost:3001',
  defaultUserId: process.env.APP_DEFAULT_USER_ID ?? 'demo-user',
  sseHeartbeatMs: Number(process.env.APP_SSE_HEARTBEAT_MS ?? 15000),
  llmCredentialsSecret: process.env.LLM_CREDENTIALS_SECRET ?? '',
  databaseUrl: process.env.DATABASE_URL ?? '',
  redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
  llmApiKey: firstNonEmpty(
    process.env.LLM_API_KEY,
    process.env.OPENROUTER_API_KEY,
    process.env.NVIDIA_API_KEY,
    process.env.ANTHROPIC_API_KEY,
    process.env.OPENAI_API_KEY,
  ),
  llmBaseUrl: (() => {
    const provider = resolveLlmProvider();
    return (
      firstNonEmpty(
        process.env.LLM_BASE_URL,
        provider === 'openrouter' ? process.env.OPENROUTER_BASE_URL : undefined,
        provider === 'nvidia' ? process.env.NVIDIA_BASE_URL : undefined,
        provider === 'anthropic' ? process.env.ANTHROPIC_BASE_URL : undefined,
        provider === 'openai' ? process.env.OPENAI_BASE_URL : undefined,
      ) ||
      (provider === 'openrouter'
        ? DEFAULT_OPENROUTER_BASE_URL
        : provider === 'nvidia'
          ? DEFAULT_NVIDIA_BASE_URL
          : provider === 'anthropic'
            ? DEFAULT_ANTHROPIC_BASE_URL
            : DEFAULT_OPENAI_BASE_URL)
    );
  })(),
  openaiApiKey: firstNonEmpty(process.env.OPENAI_API_KEY, resolveLlmProvider() === 'openai' ? process.env.LLM_API_KEY : undefined),
  openaiBaseUrl:
    firstNonEmpty(process.env.OPENAI_BASE_URL, resolveLlmProvider() === 'openai' ? process.env.LLM_BASE_URL : undefined) ||
    DEFAULT_OPENAI_BASE_URL,
  openaiModel: firstNonEmpty(process.env.OPENAI_MODEL, resolveLlmProvider() === 'openai' ? process.env.LLM_MODEL : undefined) || 'gpt-5',
  anthropicApiKey: firstNonEmpty(
    process.env.ANTHROPIC_API_KEY,
    resolveLlmProvider() === 'anthropic' ? process.env.LLM_API_KEY : undefined,
  ),
  anthropicBaseUrl:
    firstNonEmpty(
      process.env.ANTHROPIC_BASE_URL,
      resolveLlmProvider() === 'anthropic' ? process.env.LLM_BASE_URL : undefined,
    ) || DEFAULT_ANTHROPIC_BASE_URL,
  anthropicModel:
    firstNonEmpty(
      process.env.ANTHROPIC_MODEL,
      resolveLlmProvider() === 'anthropic' ? process.env.LLM_MODEL : undefined,
    ) || DEFAULT_ANTHROPIC_MODEL,
  openrouterApiKey: firstNonEmpty(
    process.env.OPENROUTER_API_KEY,
    resolveLlmProvider() === 'openrouter' ? process.env.LLM_API_KEY : undefined,
  ),
  openrouterBaseUrl:
    firstNonEmpty(
      process.env.OPENROUTER_BASE_URL,
      resolveLlmProvider() === 'openrouter' ? process.env.LLM_BASE_URL : undefined,
    ) || DEFAULT_OPENROUTER_BASE_URL,
  openrouterModel:
    firstNonEmpty(
      process.env.OPENROUTER_MODEL,
      resolveLlmProvider() === 'openrouter' ? process.env.LLM_MODEL : undefined,
    ) || DEFAULT_OPENROUTER_MODEL,
  llmModelOverride: resolveConfiguredModelOverride(),
  llmModel: (() => {
    const provider = resolveLlmProvider();
    return (
      resolveConfiguredModelOverride() ||
      (provider === 'openrouter'
        ? DEFAULT_OPENROUTER_MODEL
        : provider === 'nvidia'
          ? DEFAULT_NVIDIA_MODEL
          : provider === 'anthropic'
            ? DEFAULT_ANTHROPIC_MODEL
            : 'gpt-5')
    );
  })(),
  llmTimeoutMs: Number(process.env.LLM_TIMEOUT_MS ?? process.env.OPENAI_TIMEOUT_MS ?? 45000),
  llmMaxRetries: Number(process.env.LLM_MAX_RETRIES ?? process.env.OPENAI_MAX_RETRIES ?? 1),
  llmAppUrl: process.env.LLM_APP_URL ?? process.env.APP_BASE_URL ?? 'http://localhost:3001',
  llmAppName: process.env.LLM_APP_NAME ?? 'Multi Agent Workspace',
  orchestratorMaxParticipants: Number(process.env.ORCHESTRATOR_MAX_PARTICIPANTS ?? 3),
  orchestratorMaxRecentMessages: Number(process.env.ORCHESTRATOR_MAX_RECENT_MESSAGES ?? 20),
  queueRunAttempts: Number(process.env.QUEUE_RUN_ATTEMPTS ?? 2),
}));
