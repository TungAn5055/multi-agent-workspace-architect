'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import { api } from '@/lib/api-client';
import { ApiError } from '@/types/api';
import { CreateTopicPayload } from '@/types/topic';

export const topicKeys = {
  all: ['topics'] as const,
  detail: (topicId: string) => ['topics', topicId] as const,
  messages: (topicId: string) => ['topics', topicId, 'messages'] as const,
  run: (topicId: string, runId: string) => ['topics', topicId, 'runs', runId] as const,
};

export function useTopicsQuery() {
  return useQuery({
    queryKey: topicKeys.all,
    queryFn: api.listTopics,
  });
}

export function useTopicDetailQuery(topicId: string) {
  return useQuery({
    queryKey: topicKeys.detail(topicId),
    queryFn: () => api.getTopicDetail(topicId),
    enabled: Boolean(topicId),
  });
}

export function useCreateTopicMutation() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (payload: CreateTopicPayload) => api.createTopic(payload),
    onSuccess: async (topic) => {
      await queryClient.invalidateQueries({ queryKey: topicKeys.all });
      queryClient.setQueryData(topicKeys.detail(topic.id), topic);
      router.push(`/topics/${topic.id}`);
    },
  });
}

export function useArchiveTopicMutation(topicId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.archiveTopic(topicId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: topicKeys.all });
      await queryClient.invalidateQueries({ queryKey: topicKeys.detail(topicId) });
    },
  });
}

export function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Đã có lỗi xảy ra.';
}
