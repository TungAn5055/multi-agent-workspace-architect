'use client';

import { useState } from 'react';
import { FieldErrors, UseFieldArrayRemove, UseFormRegister, UseFormSetValue } from 'react-hook-form';

import { ModelPickerModal } from '@/components/topic-builder/model-picker-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  AGENT_ROLE_OPTIONS,
  getProviderHint,
  getProviderLabel,
  LLM_PROVIDER_OPTIONS,
} from '@/lib/constants';
import { LlmCredentialSummary, LlmProviderCatalog, ManagedLlmProvider } from '@/types/llm';
import { AgentRole } from '@/types/topic';

interface TopicBuilderValues {
  title: string;
  provider: ManagedLlmProvider;
  model: string;
  agents: Array<{
    name: string;
    role: AgentRole;
    description: string;
    provider: '' | ManagedLlmProvider;
    model: string;
  }>;
}

export function AgentFormCard({
  index,
  register,
  setValue,
  remove,
  moveUp,
  moveDown,
  canMoveUp,
  canMoveDown,
  canRemove,
  errors,
  currentRole,
  currentProvider,
  currentModel,
  topicProvider,
  topicModel,
  credentialMap,
  catalogMap,
}: {
  index: number;
  register: UseFormRegister<TopicBuilderValues>;
  setValue: UseFormSetValue<TopicBuilderValues>;
  remove: UseFieldArrayRemove;
  moveUp: () => void;
  moveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  canRemove: boolean;
  errors: FieldErrors<TopicBuilderValues>;
  currentRole: AgentRole;
  currentProvider: '' | ManagedLlmProvider;
  currentModel: string;
  topicProvider: ManagedLlmProvider;
  topicModel: string;
  credentialMap: Map<ManagedLlmProvider, LlmCredentialSummary>;
  catalogMap: Map<ManagedLlmProvider, LlmProviderCatalog>;
}) {
  const agentErrors = errors.agents?.[index];
  const effectiveProvider = currentProvider || topicProvider;
  const effectiveModel = currentModel.trim() || (!currentProvider ? topicModel : '');
  const credential = credentialMap.get(effectiveProvider);
  const catalog = catalogMap.get(effectiveProvider);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [routingPreviewOpen, setRoutingPreviewOpen] = useState(false);

  function applyModelSelection(nextModel: string) {
    setValue(`agents.${index}.model`, nextModel, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
    setPickerOpen(false);
  }

  function clearModelSelection() {
    setValue(`agents.${index}.model`, '', {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
    setPickerOpen(false);
  }

  return (
    <>
      <Card className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-mist">Agent {index + 1}</p>
            <h3 className="mt-2 font-display text-xl font-semibold text-ink">Cấu hình vai trò thảo luận</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge tone={credential?.isConfigured ? 'success' : 'warning'}>
                {credential?.isConfigured ? 'Provider ready' : 'Missing key'}
              </Badge>
              <Badge tone="default">{getProviderLabel(effectiveProvider)}</Badge>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" type="button" disabled={!canMoveUp} onClick={moveUp}>
              Lên
            </Button>
            <Button variant="ghost" type="button" disabled={!canMoveDown} onClick={moveDown}>
              Xuống
            </Button>
            <Button variant="ghost" type="button" disabled={!canRemove} onClick={() => remove(index)}>
              Xóa
            </Button>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-ink">Tên agent</label>
            <Input {...register(`agents.${index}.name`)} placeholder="VD: Lan" />
            {agentErrors?.name ? <p className="text-xs text-danger">{agentErrors.name.message}</p> : null}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-ink">Vai trò</label>
            <Select {...register(`agents.${index}.role`)}>
              {AGENT_ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <p className="text-xs text-mist">
              {AGENT_ROLE_OPTIONS.find((option) => option.value === currentRole)?.hint ??
                'Chọn role phù hợp cho nhiệm vụ của agent.'}
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-ink">Provider override</label>
            <Select {...register(`agents.${index}.provider`)}>
              <option value="">Dùng provider mặc định của topic</option>
              {LLM_PROVIDER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <p className="text-xs text-mist">
              {currentProvider
                ? `Agent này đang tách sang ${getProviderLabel(currentProvider)}.`
                : `Agent này đang kế thừa provider ${getProviderLabel(topicProvider)} từ topic.`}
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <label className="text-sm font-medium text-ink">Model cho agent</label>
              <Badge tone="default">{catalog?.models.length ?? 0} models</Badge>
            </div>
            <input type="hidden" {...register(`agents.${index}.model`)} />
            <button
              type="button"
              className="flex w-full items-center justify-between gap-3 rounded-2xl border border-line/35 bg-panel px-4 py-3 text-left text-sm text-ink outline-none transition hover:border-accent/50 hover:bg-panel/90"
              onClick={() => setPickerOpen(true)}
            >
              <span className="min-w-0 truncate font-medium">
                {effectiveModel || 'Chọn model cho agent'}
              </span>
              <span className="shrink-0 text-xs text-mist">
                Chọn
              </span>
            </button>
            {agentErrors?.model ? (
              <p className="text-xs text-danger">{agentErrors.model.message}</p>
            ) : (
              <p className="text-xs text-mist">
                {currentProvider && !currentModel.trim()
                  ? 'Khi override provider, model là bắt buộc.'
                  : currentModel.trim()
                    ? `Agent sẽ dùng model ${currentModel.trim()}.`
                    : `Agent đang kế thừa model ${topicModel}.`} {catalog ? `Catalog hiện có ${catalog.models.length} model.` : ''}
              </p>
            )}
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <label className="text-sm font-medium text-ink">Mô tả nhiệm vụ</label>
          <Textarea
            {...register(`agents.${index}.description`)}
            className="min-h-[110px]"
            placeholder="Agent này chịu trách nhiệm gì trong cuộc thảo luận?"
          />
          {agentErrors?.description && <p className="text-xs text-danger">{agentErrors.description.message}</p>}
        </div>

        <div className="mt-4 rounded-3xl border border-line/20 bg-black/10 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-mist">Preview Routing</p>
              {!routingPreviewOpen ? (
                <p className="mt-2 text-sm text-mist">
                  {getProviderLabel(effectiveProvider)} ·{' '}
                  {effectiveModel || 'Chưa chọn model cho provider override này'}
                </p>
              ) : null}
            </div>
            <Button
              variant="ghost"
              type="button"
              className="px-3 py-2 text-xs"
              aria-expanded={routingPreviewOpen}
              onClick={() => setRoutingPreviewOpen((current) => !current)}
            >
              {routingPreviewOpen ? 'Thu gọn' : 'Mở ra'}
            </Button>
          </div>

          {routingPreviewOpen ? (
            <>
              <p className="mt-3 text-sm text-ink">
                Effective provider: <span className="font-medium">{getProviderLabel(effectiveProvider)}</span>
              </p>
              <p className="mt-1 text-sm text-ink">
                Effective model:{' '}
                <span className="font-medium">{effectiveModel || 'Chưa chọn model cho provider override này'}</span>
              </p>
              <p className="mt-2 text-xs text-mist">
                {getProviderHint(effectiveProvider)} {catalog ? `Catalog hiện có ${catalog.models.length} model.` : ''}
              </p>
            </>
          ) : null}
        </div>
      </Card>

      <ModelPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title={`Model cho Agent ${index + 1}`}
        provider={effectiveProvider}
        selectedModel={effectiveModel}
        catalog={catalog}
        onApplyModel={applyModelSelection}
        clearAction={
          !currentProvider
            ? {
                label: 'Dùng model mặc định của topic',
                value: topicModel,
                onClear: clearModelSelection,
              }
            : undefined
        }
      />
    </>
  );
}
