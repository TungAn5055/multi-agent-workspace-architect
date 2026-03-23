import { ApiEnvelope, ApiError, ApiErrorPayload } from '@/types/api';
import {
  CancelRunPayload,
  CreateRunResponse,
  CreateTopicPayload,
  MessagesResponse,
  RunDetail,
  TopicDetail,
  TopicSummary,
  UpdateTopicTitlePayload,
} from '@/types/topic';
import { API_BASE_URL, USER_ID } from '@/lib/env';

async function parseJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  return text ? (JSON.parse(text) as T) : ({} as T);
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      'x-user-id': USER_ID,
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const payload = await parseJson<ApiErrorPayload>(response);
    throw new ApiError(
      payload.error ?? {
        code: 'UNKNOWN_ERROR',
        message: 'Yêu cầu thất bại.',
      },
    );
  }

  const payload = await parseJson<ApiEnvelope<T>>(response);
  return payload.data;
}

export const api = {
  getHealth: () =>
    apiFetch<{
      status: string;
      database: string;
      redis: string;
      timestamp: string;
    }>('/health'),
  listTopics: () => apiFetch<TopicSummary[]>('/topics'),
  getTopicDetail: (topicId: string) => apiFetch<TopicDetail>(`/topics/${topicId}`),
  createTopic: (payload: CreateTopicPayload) =>
    apiFetch<TopicDetail>('/topics', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateTopicTitle: (topicId: string, payload: UpdateTopicTitlePayload) =>
    apiFetch<{ id: string; title: string; status: string; updatedAt: string }>(`/topics/${topicId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  archiveTopic: (topicId: string) =>
    apiFetch<{ id: string; status: string; archivedAt: string }>(`/topics/${topicId}/archive`, {
      method: 'POST',
    }),
  getMessages: (topicId: string, cursor?: number) =>
    apiFetch<MessagesResponse>(
      `/topics/${topicId}/messages${cursor ? `?cursor=${cursor}` : ''}`,
    ),
  postHumanMessage: (topicId: string, payload: { contentMarkdown: string; clientRequestId?: string }) =>
    apiFetch<CreateRunResponse>(`/topics/${topicId}/messages`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getRunDetail: (topicId: string, runId: string) =>
    apiFetch<RunDetail>(`/topics/${topicId}/runs/${runId}`),
  cancelRun: (topicId: string, runId: string, payload: CancelRunPayload) =>
    apiFetch<{ id: string; status: string; stopReason: string }>(`/topics/${topicId}/runs/${runId}/cancel`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
