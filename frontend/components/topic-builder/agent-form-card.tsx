'use client';

import { FieldErrors, UseFieldArrayRemove, UseFormRegister } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AGENT_ROLE_OPTIONS } from '@/lib/constants';

interface TopicBuilderValues {
  title: string;
  agents: Array<{
    name: string;
    role: string;
    description: string;
  }>;
}

export function AgentFormCard({
  index,
  register,
  remove,
  moveUp,
  moveDown,
  canMoveUp,
  canMoveDown,
  canRemove,
  errors,
  currentRole,
}: {
  index: number;
  register: UseFormRegister<TopicBuilderValues>;
  remove: UseFieldArrayRemove;
  moveUp: () => void;
  moveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  canRemove: boolean;
  errors: FieldErrors<TopicBuilderValues>;
  currentRole: string;
}) {
  const agentErrors = errors.agents?.[index];

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-mist">Agent {index + 1}</p>
          <h3 className="mt-2 font-display text-xl font-semibold text-ink">Cấu hình vai trò thảo luận</h3>
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
      </div>

      <div className="mt-4 space-y-2">
        <label className="text-sm font-medium text-ink">Mô tả nhiệm vụ</label>
        <Textarea
          {...register(`agents.${index}.description`)}
          className="min-h-[110px]"
          placeholder="Agent này chịu trách nhiệm gì trong cuộc thảo luận?"
        />
        {agentErrors?.description ? (
          <p className="text-xs text-danger">{agentErrors.description.message}</p>
        ) : (
          <p className="text-xs text-mist">
            Mô tả nên đủ cụ thể để agent không bị trùng giọng với role khác.
          </p>
        )}
      </div>
    </Card>
  );
}
