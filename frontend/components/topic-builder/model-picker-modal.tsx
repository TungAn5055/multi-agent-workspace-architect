'use client';

import { useDeferredValue, useEffect, useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { cn } from '@/lib/cn';
import { getProviderLabel } from '@/lib/constants';
import { LlmProviderCatalog, ManagedLlmProvider } from '@/types/llm';

function normalizeSearchValue(value: string) {
  return value.trim().toLocaleLowerCase('vi-VN');
}

export function ModelPickerModal({
  open,
  onClose,
  title,
  provider,
  selectedModel,
  catalog,
  onApplyModel,
  clearAction,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  provider: ManagedLlmProvider;
  selectedModel: string;
  catalog?: LlmProviderCatalog;
  onApplyModel: (model: string) => void;
  clearAction?: {
    label: string;
    value: string;
    onClear: () => void;
  };
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const allModels = catalog?.models ?? [];

  useEffect(() => {
    if (!open) {
      return;
    }

    setSearchQuery('');
  }, [open]);

  const sortedModels = useMemo(() => {
    const normalizedQuery = normalizeSearchValue(deferredSearchQuery);
    const filteredModels = normalizedQuery
      ? allModels.filter((model) => {
          const searchableText = normalizeSearchValue(`${model.label} ${model.id} ${model.description}`);
          return searchableText.includes(normalizedQuery);
        })
      : allModels;

    return [...filteredModels].sort((left, right) => {
      if (left.isFree !== right.isFree) {
        return left.isFree ? -1 : 1;
      }

      return left.label.localeCompare(right.label, 'vi-VN');
    });
  }, [allModels, deferredSearchQuery]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={`Search và chọn model của ${getProviderLabel(provider)}. Model free được ưu tiên lên trên.`}
      panelClassName="max-w-4xl p-0"
    >
      <div className="flex max-h-[calc(100vh-5rem)] flex-col p-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-ink">Search model</label>
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={`Tìm theo tên, id hoặc mô tả của ${getProviderLabel(provider)}`}
            autoFocus
          />
          <p className="text-xs text-mist">
            {sortedModels.length}/{allModels.length} model hiển thị. Gõ để lọc, rồi chọn trực tiếp từ danh sách.
          </p>
        </div>

        {clearAction ? (
          <button
            type="button"
            className="mt-4 rounded-3xl border border-dashed border-line/30 bg-white/[0.04] p-4 text-left transition hover:border-accent/40 hover:bg-white/[0.06]"
            onClick={clearAction.onClear}
          >
            <p className="font-medium text-ink">{clearAction.label}</p>
            <p className="mt-1 text-xs text-mist">{clearAction.value}</p>
          </button>
        ) : null}

        <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
          <div className="grid gap-2">
            {sortedModels.length > 0 ? (
              sortedModels.map((model) => {
                const isActive = model.id === selectedModel;

                return (
                  <button
                    key={model.id}
                    type="button"
                    className={cn(
                      'rounded-3xl border px-4 py-3 text-left transition',
                      isActive
                        ? 'border-accent/45 bg-accent/10'
                        : 'border-line/20 bg-white/[0.04] hover:border-accent/35 hover:bg-white/[0.06]',
                    )}
                    onClick={() => onApplyModel(model.id)}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-ink">{model.label}</p>
                      {model.isFree ? <Badge tone="success">Free</Badge> : null}
                      {isActive ? <Badge tone="accent">Current</Badge> : null}
                    </div>
                    <p className="mt-1 break-all text-xs text-mist">{model.id}</p>
                  </button>
                );
              })
            ) : (
              <div className="rounded-3xl border border-line/20 bg-white/[0.04] p-5 text-sm text-mist">
                Không có model nào khớp với từ khóa này.
              </div>
            )}
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-3 border-t border-line/15 pt-4">
          <Button variant="ghost" type="button" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </div>
    </Modal>
  );
}
