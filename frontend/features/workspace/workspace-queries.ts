'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { topicKeys } from '@/features/topics/topic-queries';

export function useTopicMessagesQuery(topicId: string) {
  return useQuery({
    queryKey: topicKeys.messages(topicId),
    queryFn: () => api.getMessages(topicId),
    enabled: Boolean(topicId),
  });
}

export function useRunDetailQuery(topicId: string, runId: string | null) {
  return useQuery({
    queryKey: runId ? topicKeys.run(topicId, runId) : ['topics', topicId, 'runs', 'idle'],
    queryFn: () => api.getRunDetail(topicId, runId as string),
    enabled: Boolean(topicId && runId),
    refetchInterval: (query) =>
      query.state.data && ['queued', 'running'].includes(query.state.data.status) ? 3_000 : false,
  });
}

export function usePostHumanMessageMutation(topicId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { contentMarkdown: string; clientRequestId?: string }) =>
      api.postHumanMessage(topicId, payload),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: topicKeys.detail(topicId) });
      await queryClient.invalidateQueries({ queryKey: topicKeys.run(topicId, result.run.id) });
    },
  });
}

export function useCancelRunMutation(topicId: string, runId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { reason?: string }) => api.cancelRun(topicId, runId as string, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: topicKeys.detail(topicId) });
      await queryClient.invalidateQueries({ queryKey: topicKeys.messages(topicId) });
      if (runId) {
        await queryClient.invalidateQueries({ queryKey: topicKeys.run(topicId, runId) });
      }
    },
  });
}
