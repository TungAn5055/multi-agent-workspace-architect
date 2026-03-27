'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { SiteShell } from '@/components/layout/site-shell';
import { AgentFormCard } from '@/components/topic-builder/agent-form-card';
import { ModelPickerModal } from '@/components/topic-builder/model-picker-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useLlmCatalogQuery, useLlmCredentialsQuery } from '@/features/llm/llm-queries';
import { getErrorMessage, useCreateTopicMutation } from '@/features/topics/topic-queries';
import {
  AGENT_ROLE_OPTIONS,
  DEFAULT_PROVIDER_MODELS,
  getProviderLabel,
  LLM_PROVIDER_OPTIONS,
} from '@/lib/constants';
import { useToastStore } from '@/stores/toast-store';
import { ManagedLlmProvider } from '@/types/llm';
import { AgentRole } from '@/types/topic';

const topicBuilderSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, 'Title cần ít nhất 3 ký tự.')
      .max(160, 'Title không được vượt quá 160 ký tự.'),
    provider: z.enum(['openai', 'anthropic', 'openrouter']),
    model: z.string().trim().min(1, 'Model mặc định là bắt buộc.'),
    agents: z
      .array(
        z.object({
          name: z.string().trim().min(1, 'Tên agent là bắt buộc.'),
          role: z.enum(['lead', 'assistant', 'researcher', 'critic']),
          description: z.string().trim().min(1, 'Mô tả agent là bắt buộc.'),
          provider: z.union([z.literal(''), z.enum(['openai', 'anthropic', 'openrouter'])]),
          model: z.string(),
        }),
      )
      .min(2, 'Topic phải có ít nhất 2 agent.')
      .max(5, 'MVP chỉ hỗ trợ tối đa 5 agent.'),
  })
  .superRefine((value, ctx) => {
    const normalizedNames = value.agents.map((agent) => agent.name.trim().toLocaleLowerCase('vi-VN'));
    if (new Set(normalizedNames).size !== normalizedNames.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['agents'],
        message: 'Tên agent trong cùng topic không được trùng nhau.',
      });
    }

    value.agents.forEach((agent, index) => {
      if (agent.provider && !agent.model.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['agents', index, 'model'],
          message: 'Khi override provider cho agent, model là bắt buộc.',
        });
      }
    });
  });

type TopicBuilderValues = z.infer<typeof topicBuilderSchema>;

const defaultAgent = (
  role: AgentRole,
  name: string,
  description: string,
): TopicBuilderValues['agents'][number] => ({
  name,
  role,
  description,
  provider: '',
  model: '',
});

export function TopicBuilderPage() {
  const pushToast = useToastStore((state) => state.push);
  const createTopicMutation = useCreateTopicMutation();
  const catalogQuery = useLlmCatalogQuery();
  const credentialsQuery = useLlmCredentialsQuery();
  const form = useForm<TopicBuilderValues>({
    resolver: zodResolver(topicBuilderSchema),
    defaultValues: {
      title: '',
      provider: 'openrouter',
      model: DEFAULT_PROVIDER_MODELS.openrouter,
      agents: [
        defaultAgent('lead', 'Lan', 'Điều phối, tổng hợp, chốt hướng và là người duy nhất có thể hỏi ngược Human.'),
        defaultAgent('researcher', 'Minh', 'Đào sâu giả định, điểm mù và rủi ro cần soi thêm.'),
      ],
    },
    mode: 'onChange',
  });

  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: 'agents',
  });

  const watchedProvider = form.watch('provider');
  const watchedModel = form.watch('model');
  const watchedAgents = form.watch('agents');
  const previousProviderRef = useRef<ManagedLlmProvider>(watchedProvider);
  const [topicModelPickerOpen, setTopicModelPickerOpen] = useState(false);

  useEffect(() => {
    const previousProvider = previousProviderRef.current;
    if (previousProvider === watchedProvider) {
      return;
    }

    const currentModel = form.getValues('model').trim();
    if (!currentModel || currentModel === DEFAULT_PROVIDER_MODELS[previousProvider]) {
      form.setValue('model', DEFAULT_PROVIDER_MODELS[watchedProvider], {
        shouldDirty: true,
        shouldValidate: true,
      });
    }

    previousProviderRef.current = watchedProvider;
  }, [form, watchedProvider]);

  const credentialMap = useMemo(
    () => new Map((credentialsQuery.data ?? []).map((item) => [item.provider, item])),
    [credentialsQuery.data],
  );
  const catalogMap = useMemo(
    () => new Map((catalogQuery.data ?? []).map((item) => [item.provider, item])),
    [catalogQuery.data],
  );

  const routingPreview = watchedAgents.map((agent, index) => {
    const effectiveProvider = (agent.provider || watchedProvider) as ManagedLlmProvider;
    const effectiveModel = agent.model.trim() || (!agent.provider ? watchedModel.trim() : '');
    return {
      index,
      name: agent.name.trim() || `Agent ${index + 1}`,
      role: agent.role,
      effectiveProvider,
      effectiveModel,
      isReady: credentialMap.get(effectiveProvider)?.isConfigured ?? false,
    };
  });

  const usedProviders = Array.from(
    new Set<ManagedLlmProvider>([
      watchedProvider,
      ...watchedAgents
        .map((agent) => agent.provider)
        .filter((provider): provider is ManagedLlmProvider => Boolean(provider)),
    ]),
  );
  const missingProviders = usedProviders.filter(
    (provider) => !credentialMap.get(provider)?.isConfigured,
  );

  const selectedCatalog = catalogMap.get(watchedProvider);

  return (
    <SiteShell
      title="Tạo topic mới"
      subtitle="Chọn provider/model mặc định cho topic, rồi override theo từng agent nếu cần. Topic mới sẽ chạy thật theo credential đã cấu hình trong LLM Settings."
    >
      <form
        className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_380px]"
        onSubmit={form.handleSubmit(async (values) => {
          if (missingProviders.length > 0) {
            pushToast({
              title: 'Thiếu credential',
              description: `Hãy cấu hình key cho ${missingProviders.map(getProviderLabel).join(', ')} trước khi tạo topic.`,
              tone: 'warning',
            });
            return;
          }

          try {
            await createTopicMutation.mutateAsync({
              title: values.title.trim(),
              provider: values.provider,
              model: values.model.trim(),
              agents: values.agents.map((agent) => ({
                name: agent.name.trim(),
                role: agent.role,
                description: agent.description.trim(),
                provider: agent.provider || undefined,
                model: agent.model.trim() || undefined,
              })),
            });
          } catch (error) {
            pushToast({
              title: 'Tạo topic thất bại',
              description: getErrorMessage(error),
              tone: 'danger',
            });
          }
        })}
      >
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-mist">Meta topic</p>
                <h2 className="mt-3 font-display text-3xl font-semibold text-ink">Định nghĩa tuyến model mặc định</h2>
              </div>
            </div>

            <div className="mt-6 space-y-2">
              <label className="text-sm font-medium text-ink">Title topic</label>
              <Input {...form.register('title')} placeholder="VD: Lên kế hoạch MVP cho workspace đa agent" />
              {form.formState.errors.title ? (
                <p className="text-xs text-danger">{form.formState.errors.title.message}</p>
              ) : (
                <p className="text-xs text-mist">
                  Gợi ý: title càng cụ thể thì orchestration và vai trò agent càng dễ rõ ràng hơn.
                </p>
              )}
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
              <div className="space-y-2">
                <label className="text-sm font-medium text-ink">Provider mặc định</label>
                <Select {...form.register('provider')}>
                  {LLM_PROVIDER_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
                <p className="text-xs text-mist">
                  Agent không override provider sẽ đi theo lựa chọn này.
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-ink">Model mặc định của topic</label>
                <input type="hidden" {...form.register('model')} />
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-3 rounded-2xl border border-line/35 bg-panel px-4 py-3 text-left text-sm text-ink outline-none transition hover:border-accent/50 hover:bg-panel/90"
                  onClick={() => setTopicModelPickerOpen(true)}
                >
                  <span className="min-w-0 truncate font-medium">
                    {watchedModel || 'Chọn model mặc định cho topic'}
                  </span>
                  <span className="shrink-0 text-xs text-mist">
                    Chọn
                  </span>
                </button>
                {form.formState.errors.model ? (
                  <p className="text-xs text-danger">{form.formState.errors.model.message}</p>
                ) : (
                  <p className="text-xs text-mist">
                    {selectedCatalog
                      ? `${selectedCatalog.models.length} model đang sẵn sàng cho provider này.`
                      : 'Chờ catalog tải xong rồi chọn model từ popup.'}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-line/20 bg-white/[0.04] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-mist">Default Route</p>
                <p className="mt-2 font-medium text-ink">{getProviderLabel(watchedProvider)}</p>
                <p className="mt-1 text-xs text-mist">{watchedModel}</p>
              </div>
              <div className="rounded-3xl border border-line/20 bg-white/[0.04] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-mist">Credential Status</p>
                <p className="mt-2 font-medium text-ink">
                  {credentialMap.get(watchedProvider)?.isConfigured ? 'Ready to run' : 'Missing key'}
                </p>
                <p className="mt-1 text-xs text-mist">
                  {credentialMap.get(watchedProvider)?.isConfigured
                    ? `Nguồn key: ${credentialMap.get(watchedProvider)?.source}.`
                    : 'Provider này chưa có credential khả dụng.'}
                </p>
              </div>
            </div>
          </Card>

          <div className="space-y-4">
            {fields.map((field, index) => (
              <AgentFormCard
                key={field.id}
                index={index}
                register={form.register}
                setValue={form.setValue}
                remove={remove}
                moveUp={() => move(index, index - 1)}
                moveDown={() => move(index, index + 1)}
                canMoveUp={index > 0}
                canMoveDown={index < fields.length - 1}
                canRemove={watchedAgents.length > 2}
                errors={form.formState.errors}
                currentRole={watchedAgents[index]?.role ?? field.role}
                currentProvider={watchedAgents[index]?.provider ?? ''}
                currentModel={watchedAgents[index]?.model ?? ''}
                topicProvider={watchedProvider}
                topicModel={watchedModel}
                credentialMap={credentialMap}
                catalogMap={catalogMap}
              />
            ))}
          </div>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-display text-xl font-semibold text-ink">Thêm agent</p>
                <p className="mt-2 text-sm text-mist">Dùng các role khác nhau để tránh mọi agent nói cùng một kiểu.</p>
              </div>
              <Button
                variant="secondary"
                type="button"
                disabled={watchedAgents.length >= 5}
                onClick={() =>
                  append(
                    defaultAgent(
                      'assistant',
                      '',
                      'Mở rộng, sắp xếp ý hoặc nối tiếp phần phân tích hiện có.',
                    ),
                  )
                }
              >
                Thêm Agent
              </Button>
            </div>

            <div className="mt-5 grid gap-3">
              {AGENT_ROLE_OPTIONS.map((option) => (
                <div key={option.value} className="rounded-2xl border border-line/20 bg-white/[0.04] p-4">
                  <p className="font-medium text-ink">{option.label}</p>
                  <p className="mt-1 text-sm text-mist">{option.hint}</p>
                </div>
              ))}
            </div>
          </Card>

          {form.formState.errors.agents?.message ? (
            <p className="rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
              {form.formState.errors.agents.message}
            </p>
          ) : null}

          <div className="flex flex-wrap justify-end gap-3">
            <Button variant="ghost" href="/topics">
              Quay lại
            </Button>
            <Button
              type="submit"
              loading={createTopicMutation.isPending}
              disabled={!form.formState.isValid}
            >
              Tạo topic và vào workspace
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-mist">Routing Preview</p>
                <p className="mt-3 text-sm leading-6 text-mist">
                  Đây là tuyến thực sẽ được gửi xuống backend. Agent nào không override sẽ kế thừa provider/model mặc định của topic.
                </p>
              </div>
              <Badge tone={missingProviders.length === 0 ? 'success' : 'warning'}>
                {missingProviders.length === 0 ? 'Ready' : 'Missing keys'}
              </Badge>
            </div>

            <div className="mt-5 space-y-3">
              {routingPreview.map((agent) => (
                <div key={`${agent.name}-${agent.index}`} className="rounded-2xl border border-line/20 bg-white/[0.04] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-ink">{agent.name}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-mist">{agent.role}</p>
                    </div>
                    <Badge tone={agent.isReady ? 'success' : 'warning'}>
                      {agent.isReady ? 'Provider ready' : 'Missing key'}
                    </Badge>
                  </div>
                  <p className="mt-3 text-sm text-ink">{getProviderLabel(agent.effectiveProvider)}</p>
                  <p className="mt-1 text-xs text-mist">
                    {agent.effectiveModel || 'Chưa có model hợp lệ cho tuyến override này'}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <p className="text-xs uppercase tracking-[0.22em] text-mist">Provider Status</p>
            <div className="mt-4 space-y-3">
              {LLM_PROVIDER_OPTIONS.map((provider) => {
                const credential = credentialMap.get(provider.value);
                const catalog = catalogMap.get(provider.value);

                return (
                  <div key={provider.value} className="rounded-2xl border border-line/20 bg-white/[0.04] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-ink">{provider.label}</p>
                      <Badge tone={credential?.isConfigured ? 'success' : 'warning'}>
                        {credential?.isConfigured ? credential.source : 'Missing'}
                      </Badge>
                    </div>
                    <p className="mt-2 text-xs text-mist">
                      {catalog ? `${catalog.models.length} model suggestion` : 'Catalog chưa sẵn sàng'}
                    </p>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="p-6">
            <p className="text-xs uppercase tracking-[0.22em] text-mist">Checklist</p>
            <ul className="mt-4 space-y-3 text-sm text-mist">
              <li>Ít nhất 2 agent, tối đa 5 agent cho MVP.</li>
              <li>Tên agent không được trùng nhau trong cùng topic.</li>
              <li>Chỉ Lead mới có quyền hỏi ngược Human khi đang chạy run.</li>
              <li>Prompt agent sẽ bị khóa sau message đầu tiên.</li>
              <li>Provider nào được route tới thì phải có credential khả dụng.</li>
            </ul>
          </Card>
        </div>
      </form>

      <ModelPickerModal
        open={topicModelPickerOpen}
        onClose={() => setTopicModelPickerOpen(false)}
        title="Model mặc định của topic"
        provider={watchedProvider}
        selectedModel={watchedModel}
        catalog={selectedCatalog}
        onApplyModel={(model) => {
          form.setValue('model', model, {
            shouldDirty: true,
            shouldTouch: true,
            shouldValidate: true,
          });
          setTopicModelPickerOpen(false);
        }}
      />
    </SiteShell>
  );
}
