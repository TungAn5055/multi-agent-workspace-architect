import { registerAs } from '@nestjs/config';

export type LlmProvider = 'openai' | 'nvidia' | 'openrouter';

const DEFAULT_NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';
const DEFAULT_NVIDIA_MODEL = 'nvidia/nemotron-3-super-120b-a12b';
const DEFAULT_OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
const DEFAULT_OPENROUTER_MODEL = 'nvidia/nemotron-3-super-120b-a12b:free';

function firstNonEmpty(...values: Array<string | undefined>): string {
  return values.find((value) => value?.trim())?.trim() ?? '';
}

function resolveConfiguredModelOverride(): string {
  return firstNonEmpty(
    process.env.OPENAI_MODEL,
    process.env.NVIDIA_MODEL,
    process.env.OPENROUTER_MODEL,
    process.env.LLM_MODEL,
  );
}

function resolveLlmProvider(): LlmProvider {
  const configuredProvider = firstNonEmpty(process.env.LLM_PROVIDER).toLowerCase();
  if (configuredProvider === 'nvidia' || configuredProvider === 'openai' || configuredProvider === 'openrouter') {
    return configuredProvider;
  }

  const model = firstNonEmpty(
    process.env.LLM_MODEL,
    process.env.OPENROUTER_MODEL,
    process.env.NVIDIA_MODEL,
    process.env.OPENAI_MODEL,
  ).toLowerCase();
  const baseUrl = firstNonEmpty(
    process.env.LLM_BASE_URL,
    process.env.OPENROUTER_BASE_URL,
    process.env.NVIDIA_BASE_URL,
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

  return 'openai';
}

export const appConfig = registerAs('app', () => ({
  llmProvider: resolveLlmProvider(),
  host: process.env.APP_HOST ?? '0.0.0.0',
  port: Number(process.env.APP_PORT ?? 3001),
  baseUrl: process.env.APP_BASE_URL ?? 'http://localhost:3001',
  defaultUserId: process.env.APP_DEFAULT_USER_ID ?? 'demo-user',
  sseHeartbeatMs: Number(process.env.APP_SSE_HEARTBEAT_MS ?? 15000),
  databaseUrl: process.env.DATABASE_URL ?? '',
  redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
  llmApiKey: firstNonEmpty(
    process.env.LLM_API_KEY,
    process.env.OPENROUTER_API_KEY,
    process.env.NVIDIA_API_KEY,
    process.env.OPENAI_API_KEY,
  ),
  llmBaseUrl:
    firstNonEmpty(process.env.LLM_BASE_URL, process.env.OPENROUTER_BASE_URL, process.env.NVIDIA_BASE_URL) ||
    (resolveLlmProvider() === 'openrouter'
      ? DEFAULT_OPENROUTER_BASE_URL
      : resolveLlmProvider() === 'nvidia'
        ? DEFAULT_NVIDIA_BASE_URL
        : ''),
  llmModelOverride: resolveConfiguredModelOverride(),
  llmModel:
    resolveConfiguredModelOverride() ||
    (resolveLlmProvider() === 'openrouter'
      ? DEFAULT_OPENROUTER_MODEL
      : resolveLlmProvider() === 'nvidia'
        ? DEFAULT_NVIDIA_MODEL
        : 'gpt-5'),
  llmTimeoutMs: Number(process.env.LLM_TIMEOUT_MS ?? process.env.OPENAI_TIMEOUT_MS ?? 45000),
  llmMaxRetries: Number(process.env.LLM_MAX_RETRIES ?? process.env.OPENAI_MAX_RETRIES ?? 1),
  llmAppUrl: process.env.LLM_APP_URL ?? process.env.APP_BASE_URL ?? 'http://localhost:3001',
  llmAppName: process.env.LLM_APP_NAME ?? 'Multi Agent Workspace',
  orchestratorMaxParticipants: Number(process.env.ORCHESTRATOR_MAX_PARTICIPANTS ?? 3),
  orchestratorMaxRecentMessages: Number(process.env.ORCHESTRATOR_MAX_RECENT_MESSAGES ?? 20),
  queueRunAttempts: Number(process.env.QUEUE_RUN_ATTEMPTS ?? 2),
}));
