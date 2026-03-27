'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { ManagedLlmProvider, UpsertLlmCredentialPayload } from '@/types/llm';

export const llmKeys = {
  credentials: ['llm', 'credentials'] as const,
  catalog: ['llm', 'catalog'] as const,
};

export function useLlmCredentialsQuery() {
  return useQuery({
    queryKey: llmKeys.credentials,
    queryFn: api.getLlmCredentials,
  });
}

export function useLlmCatalogQuery() {
  return useQuery({
    queryKey: llmKeys.catalog,
    queryFn: api.getLlmCatalog,
    staleTime: 60_000,
  });
}

export function useUpsertLlmCredentialMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { provider: ManagedLlmProvider; payload: UpsertLlmCredentialPayload }) =>
      api.upsertLlmCredential(input.provider, input.payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: llmKeys.credentials }),
        queryClient.invalidateQueries({ queryKey: llmKeys.catalog }),
      ]);
    },
  });
}

export function useDeleteLlmCredentialMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (provider: ManagedLlmProvider) => api.deleteLlmCredential(provider),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: llmKeys.credentials }),
        queryClient.invalidateQueries({ queryKey: llmKeys.catalog }),
      ]);
    },
  });
}
