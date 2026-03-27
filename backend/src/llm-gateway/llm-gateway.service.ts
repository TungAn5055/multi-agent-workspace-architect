import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import type { ChatCompletionChunk, ChatCompletionMessageParam } from 'openai/resources/chat/completions';

import { AppException } from 'src/common/exceptions/app.exception';
import { ERROR_CODES } from 'src/common/exceptions/error-codes';
import { LlmProvider, ManagedLlmProvider } from 'src/config/app.config';
import { AppConfigService } from 'src/config/app-config.service';

export interface StreamAgentReplyInput {
  provider: ManagedLlmProvider | LlmProvider;
  apiKey: string;
  baseUrl?: string;
  model: string;
  instructions: string;
  prompt: string;
  onDelta: (delta: string) => void;
  signal?: AbortSignal;
}

export interface StreamAgentReplyOutput {
  content: string;
  requestId: string | null;
  inputTokens: number;
  outputTokens: number;
  responseSnapshot: unknown;
}

interface ResponsesStreamEvent {
  type: string;
  delta?: string;
  response?: {
    id?: string;
    usage?: {
      input_tokens?: number;
      output_tokens?: number;
    };
  };
  error?: {
    message?: string;
  };
}

interface CompatibleChatCompletionUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
  promptTokens?: number;
  completionTokens?: number;
  reasoning_tokens?: number;
  reasoningTokens?: number;
}

type CompatibleChatCompletionChunk = ChatCompletionChunk & {
  error?: {
    message?: string;
    code?: string;
  };
};

@Injectable()
export class LlmGatewayService {
  private readonly logger = new Logger(LlmGatewayService.name);
  private readonly clients = new Map<string, OpenAI>();

  constructor(private readonly appConfig: AppConfigService) {}

  async streamAgentReply(input: StreamAgentReplyInput): Promise<StreamAgentReplyOutput> {
    if (!input.apiKey.trim()) {
      throw new AppException({
        status: 500,
        code: ERROR_CODES.llmRequestFailed,
        message: `Thiếu API key cho provider ${input.provider} nên chưa thể gọi model.`,
      });
    }

    const model = this.appConfig.resolveLlmModel(input.provider, input.model);
    const client = this.getClient(input.provider, input.apiKey, input.baseUrl);

    if (input.provider === 'anthropic' || input.provider === 'nvidia' || input.provider === 'openrouter') {
      return this.streamChatCompletions(client, {
        ...input,
        model,
      });
    }

    return this.streamResponses(client, {
      ...input,
      model,
    });
  }

  private getClient(provider: StreamAgentReplyInput['provider'], apiKey: string, baseUrl?: string) {
    const resolvedBaseUrl = baseUrl?.trim() || this.appConfig.resolveProviderBaseUrl(provider);
    const cacheKey = `${provider}:${resolvedBaseUrl}:${apiKey}`;
    const cachedClient = this.clients.get(cacheKey);
    if (cachedClient) {
      return cachedClient;
    }

    const client = new OpenAI({
      apiKey,
      baseURL: resolvedBaseUrl || undefined,
      timeout: this.appConfig.llmTimeoutMs,
      maxRetries: this.appConfig.llmMaxRetries,
      defaultHeaders: this.buildDefaultHeaders(provider),
    });

    this.clients.set(cacheKey, client);
    return client;
  }

  private buildDefaultHeaders(provider: StreamAgentReplyInput['provider']) {
    if (provider !== 'openrouter') {
      return undefined;
    }

    const headers: Record<string, string> = {};

    if (this.appConfig.llmAppUrl) {
      headers['HTTP-Referer'] = this.appConfig.llmAppUrl;
    }

    if (this.appConfig.llmAppName) {
      headers['X-OpenRouter-Title'] = this.appConfig.llmAppName;
      headers['X-Title'] = this.appConfig.llmAppName;
    }

    return headers;
  }

  private async streamResponses(
    client: OpenAI,
    input: StreamAgentReplyInput,
  ): Promise<StreamAgentReplyOutput> {
    const startedAt = Date.now();
    let content = '';
    let lastEvent: ResponsesStreamEvent | null = null;
    let responseId: string | null = null;
    let inputTokens = 0;
    let outputTokens = 0;

    try {
      const stream = (await client.responses.create(
        {
          model: input.model,
          stream: true,
          store: false,
          input: [
            {
              role: 'system',
              content: [{ type: 'input_text', text: input.instructions }],
            },
            {
              role: 'user',
              content: [{ type: 'input_text', text: input.prompt }],
            },
          ],
        },
        input.signal ? { signal: input.signal } : undefined,
      )) as unknown as AsyncIterable<ResponsesStreamEvent>;

      for await (const event of stream) {
        lastEvent = event;
        if (event.type === 'response.output_text.delta' && event.delta) {
          content += event.delta;
          input.onDelta(event.delta);
        }

        if (event.type === 'response.completed' && event.response) {
          responseId = event.response.id ?? null;
          inputTokens = event.response.usage?.input_tokens ?? inputTokens;
          outputTokens = event.response.usage?.output_tokens ?? outputTokens;
        }

        if (event.type === 'response.failed') {
          throw new Error(event.error?.message ?? 'OpenAI response stream failed.');
        }

        if (input.signal?.aborted) {
          throw new Error('Request aborted');
        }
      }
    } catch (error) {
      const latency = Date.now() - startedAt;
      this.logger.error(
        `LLM provider=${input.provider} call failed after ${latency}ms`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new AppException({
        status: 502,
        code: ERROR_CODES.llmRequestFailed,
        message: error instanceof Error ? error.message : 'LLM request failed.',
      });
    }

    const latency = Date.now() - startedAt;
    this.logger.log(
      `LLM provider=${input.provider} completed in ${latency}ms model=${input.model} responseId=${responseId ?? 'n/a'} inputTokens=${inputTokens} outputTokens=${outputTokens}`,
    );

    return {
      content: content.trim(),
      requestId: responseId,
      inputTokens,
      outputTokens,
      responseSnapshot: {
        provider: input.provider,
        responseId,
        content,
        lastEvent,
      },
    };
  }

  private async streamChatCompletions(
    client: OpenAI,
    input: StreamAgentReplyInput,
  ): Promise<StreamAgentReplyOutput> {
    const startedAt = Date.now();
    const messages: ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: input.instructions,
      },
      {
        role: 'user',
        content: input.prompt,
      },
    ];

    let content = '';
    let lastChunk: ChatCompletionChunk | null = null;
    let responseId: string | null = null;
    let inputTokens = 0;
    let outputTokens = 0;
    let reasoningTokens = 0;

    try {
      const stream = await client.chat.completions.create(
        {
          model: input.model,
          stream: true,
          messages,
          ...(input.provider === 'openrouter'
            ? {
                stream_options: {
                  include_usage: true,
                },
              }
            : {}),
        },
        input.signal ? { signal: input.signal } : undefined,
      );

      for await (const chunk of stream) {
        const compatibleChunk = chunk as CompatibleChatCompletionChunk;
        const usage = chunk.usage as CompatibleChatCompletionUsage | null | undefined;
        lastChunk = chunk;
        responseId = chunk.id ?? responseId;
        inputTokens = usage?.prompt_tokens ?? usage?.promptTokens ?? inputTokens;
        outputTokens = usage?.completion_tokens ?? usage?.completionTokens ?? outputTokens;
        reasoningTokens = usage?.reasoning_tokens ?? usage?.reasoningTokens ?? reasoningTokens;

        if (compatibleChunk.error?.message) {
          throw new Error(compatibleChunk.error.message);
        }

        const delta = chunk.choices[0]?.delta?.content ?? chunk.choices[0]?.delta?.refusal ?? '';
        if (delta) {
          content += delta;
          input.onDelta(delta);
        }

        if (input.signal?.aborted) {
          throw new Error('Request aborted');
        }
      }
    } catch (error) {
      const latency = Date.now() - startedAt;
      this.logger.error(
        `LLM provider=${input.provider} call failed after ${latency}ms`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new AppException({
        status: 502,
        code: ERROR_CODES.llmRequestFailed,
        message: error instanceof Error ? error.message : 'LLM request failed.',
      });
    }

    const latency = Date.now() - startedAt;
    this.logger.log(
      `LLM provider=${input.provider} completed in ${latency}ms model=${input.model} responseId=${responseId ?? 'n/a'} inputTokens=${inputTokens} outputTokens=${outputTokens}`,
    );

    return {
      content: content.trim(),
      requestId: responseId,
      inputTokens,
      outputTokens,
      responseSnapshot: {
        provider: input.provider,
        responseId,
        content,
        usage: {
          inputTokens,
          outputTokens,
          reasoningTokens,
        },
        lastChunk,
      },
    };
  }
}
