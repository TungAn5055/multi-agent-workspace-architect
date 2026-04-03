'use client';

import { useMemo, useState } from 'react';

import { SiteShell } from '@/components/layout/site-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  useDeleteLlmCredentialMutation,
  useLlmCatalogQuery,
  useLlmCredentialsQuery,
  useUpsertLlmCredentialMutation,
} from '@/features/llm/llm-queries';
import { getProviderHint, getProviderLabel, LLM_PROVIDER_OPTIONS } from '@/lib/constants';
import { useToastStore } from '@/stores/toast-store';
import { ApiError } from '@/types/api';
import { ManagedLlmProvider } from '@/types/llm';

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Đã có lỗi xảy ra.';
}

export function LlmSettingsPage() {
  const pushToast = useToastStore((state) => state.push);
  const credentialsQuery = useLlmCredentialsQuery();
  const catalogQuery = useLlmCatalogQuery();
  const upsertMutation = useUpsertLlmCredentialMutation();
  const deleteMutation = useDeleteLlmCredentialMutation();
  const [draftKeys, setDraftKeys] = useState<Record<ManagedLlmProvider, string>>({
    anthropic: '',
    openai: '',
    openrouter: '',
  });

  const credentialMap = useMemo(
    () =>
      new Map((credentialsQuery.data ?? []).map((item) => [item.provider, item])),
    [credentialsQuery.data],
  );
  const catalogMap = useMemo(
    () => new Map((catalogQuery.data ?? []).map((item) => [item.provider, item])),
    [catalogQuery.data],
  );

  return (
    <SiteShell
      title="LLM Settings"
      subtitle=""
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_360px]">
        <div className="space-y-6">
          {LLM_PROVIDER_OPTIONS.map((provider) => {
            const credential = credentialMap.get(provider.value);
            const catalog = catalogMap.get(provider.value);
            const isSaving =
              upsertMutation.isPending && upsertMutation.variables?.provider === provider.value;
            const isDeleting =
              deleteMutation.isPending && deleteMutation.variables === provider.value;

            return (
              <Card key={provider.value} className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-display text-2xl font-semibold text-ink">
                        {getProviderLabel(provider.value)}
                      </h2>
                      <Badge tone={credential?.isConfigured ? 'success' : 'warning'}>
                        {credential?.isConfigured ? 'Configured' : 'Missing key'}
                      </Badge>
                      {credential?.source === 'env' ? <Badge tone="default">Env fallback</Badge> : null}
                      {credential?.source === 'saved' ? <Badge tone="accent">Saved in app</Badge> : null}
                    </div>
                  </div>
                  <div className="rounded-3xl border border-line/20 bg-white/[0.04] px-4 py-3 text-right">
                    <p className="text-xs uppercase tracking-[0.2em] text-mist">Catalog : {catalog?.models.length ?? 0}</p>
                  </div>
                </div>

                <div className="mt-5 w-full space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-ink">API key</label>
                    <Input
                      type="password"
                      value={draftKeys[provider.value]}
                      onChange={(event) =>
                        setDraftKeys((current) => ({
                          ...current,
                          [provider.value]: event.target.value,
                        }))
                      }
                      placeholder={`Nhập key cho ${getProviderLabel(provider.value)}`}
                    />
                    <p className="text-xs text-mist">
                      {credential?.keyHint
                        ? `Key đang dùng: ${credential.keyHint}`
                        : 'Chưa có key nào được lưu cho provider này.'}
                    </p>
                  </div>
                  <div className="rounded-3xl border border-line/20 bg-black/10 p-4 text-sm text-mist">
                    <p className="text-xs uppercase tracking-[0.18em] text-mist">Source</p>
                    <p className="mt-2 font-medium text-ink">
                      {credential?.source === 'saved'
                        ? 'App storage'
                        : credential?.source === 'env'
                          ? 'Environment'
                          : 'Missing'}
                    </p>
                    <p className="mt-2 text-xs text-mist">
                      {credential?.updatedAt &&  `Cập nhật ${new Date(credential.updatedAt).toLocaleString('vi-VN')}`}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <Button
                    loading={isSaving}
                    disabled={!draftKeys[provider.value].trim()}
                    onClick={async () => {
                      try {
                        await upsertMutation.mutateAsync({
                          provider: provider.value,
                          payload: {
                            apiKey: draftKeys[provider.value].trim(),
                          },
                        });
                        setDraftKeys((current) => ({
                          ...current,
                          [provider.value]: '',
                        }));
                        pushToast({
                          title: 'Đã lưu API key',
                          description: `${getProviderLabel(provider.value)} đã sẵn sàng để dùng trong topic.`,
                          tone: 'success',
                        });
                      } catch (error) {
                        pushToast({
                          title: 'Lưu key thất bại',
                          description: getErrorMessage(error),
                          tone: 'danger',
                        });
                      }
                    }}
                  >
                    Lưu key
                  </Button>
                  <Button
                    variant="ghost"
                    loading={isDeleting}
                    disabled={credential?.source !== 'saved'}
                    onClick={async () => {
                      try {
                        await deleteMutation.mutateAsync(provider.value);
                        pushToast({
                          title: 'Đã xóa key đã lưu',
                          description:
                            credential?.source === 'saved'
                              ? `Credential riêng của ${getProviderLabel(provider.value)} đã bị gỡ khỏi app.`
                              : undefined,
                          tone: 'warning',
                        });
                      } catch (error) {
                        pushToast({
                          title: 'Xóa key thất bại',
                          description: getErrorMessage(error),
                          tone: 'danger',
                        });
                      }
                    }}
                  >
                    Xóa key đã lưu
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="space-y-4">
          <Card className="p-6">
            <p className="text-xs uppercase tracking-[0.22em] text-mist">Provider Notes</p>
            <div className="mt-4 space-y-3 text-sm leading-6 text-mist">
              <p>OpenRouter phù hợp nhất nếu bạn muốn mix nhiều model trong cùng một topic và tận dụng cả biến thể free.</p>
              <p>OpenAI và Claude dùng key direct, phù hợp khi bạn muốn billing tách riêng thay vì route qua OpenRouter.</p>
              <p>Key chỉ được lưu phía backend; frontend không nhận lại raw secret sau khi save.</p>
            </div>
          </Card>

          <Card className="p-6">
            <p className="text-xs uppercase tracking-[0.22em] text-mist">Health Check</p>
            <div className="mt-4 space-y-3">
              {LLM_PROVIDER_OPTIONS.map((provider) => {
                const credential = credentialMap.get(provider.value);
                const catalog = catalogMap.get(provider.value);
                return (
                  <div key={provider.value} className="rounded-2xl border border-line/20 bg-white/[0.04] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-ink">{provider.label}</p>
                      <Badge tone={credential?.isConfigured ? 'success' : 'warning'}>
                        {credential?.isConfigured ? 'Ready' : 'Missing'}
                      </Badge>
                    </div>
                    <p className="mt-2 text-xs text-mist">
                      {catalog ? `${catalog.models.length} model suggestion` : 'Catalog đang tải'}
                    </p>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </SiteShell>
  );
}
