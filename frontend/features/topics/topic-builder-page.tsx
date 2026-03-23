'use client';
import { useMemo } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { SiteShell } from '@/components/layout/site-shell';
import { AgentFormCard } from '@/components/topic-builder/agent-form-card';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { AGENT_ROLE_OPTIONS } from '@/lib/constants';
import { useToastStore } from '@/stores/toast-store';
import { getErrorMessage, useCreateTopicMutation } from '@/features/topics/topic-queries';

const topicBuilderSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, 'Title cần ít nhất 3 ký tự.')
      .max(160, 'Title không được vượt quá 160 ký tự.'),
    agents: z
      .array(
        z.object({
          name: z.string().trim().min(1, 'Tên agent là bắt buộc.'),
          role: z.enum(['lead', 'assistant', 'researcher', 'critic']),
          description: z.string().trim().min(1, 'Mô tả agent là bắt buộc.'),
        }),
      )
      .min(2, 'Topic phải có ít nhất 2 agent.')
      .max(5, 'MVP chỉ hỗ trợ tối đa 5 agent.'),
  })
  .superRefine((value, ctx) => {
    const normalizedNames = value.agents.map((agent) => agent.name.trim().toLocaleLowerCase('vi-VN'));
    const hasDuplicates = new Set(normalizedNames).size !== normalizedNames.length;

    if (hasDuplicates) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['agents'],
        message: 'Tên agent trong cùng topic không được trùng nhau.',
      });
    }
  });

type TopicBuilderValues = z.infer<typeof topicBuilderSchema>;

const defaultAgent = (role: (typeof AGENT_ROLE_OPTIONS)[number]['value'], name: string, description: string) => ({
  name,
  role,
  description,
});

export function TopicBuilderPage() {
  const pushToast = useToastStore((state) => state.push);
  const createTopicMutation = useCreateTopicMutation();
  const form = useForm<TopicBuilderValues>({
    resolver: zodResolver(topicBuilderSchema),
    defaultValues: {
      title: '',
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

  const agentCount = form.watch('agents').length;

  const roleHints = useMemo(
    () =>
      AGENT_ROLE_OPTIONS.reduce<Record<string, string>>((accumulator, option) => {
        accumulator[option.value] = option.hint;
        return accumulator;
      }, {}),
    [],
  );

  return (
    <SiteShell
      title="Tạo topic mới"
      subtitle="Topic chỉ lưu cấu hình ở bước này. Hệ thống sẽ không tự chạy cho tới khi Human gửi message đầu tiên trong workspace."
    >
      <form
        className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_360px]"
        onSubmit={form.handleSubmit(async (values) => {
          try {
            await createTopicMutation.mutateAsync(values);
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
            <p className="text-xs uppercase tracking-[0.22em] text-mist">Meta topic</p>
            <h2 className="mt-3 font-display text-3xl font-semibold text-ink">Định nghĩa bối cảnh làm việc</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-mist">
              Title nên phản ánh mục tiêu Human thật sự muốn cả đội agent cùng giải quyết. Mỗi topic dùng chung một model và prompt agent sẽ bị khóa sau khi có history.
            </p>

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
          </Card>

          <div className="space-y-4">
            {fields.map((field, index) => (
              <AgentFormCard
                key={field.id}
                index={index}
                register={form.register}
                remove={remove}
                moveUp={() => move(index, index - 1)}
                moveDown={() => move(index, index + 1)}
                canMoveUp={index > 0}
                canMoveDown={index < fields.length - 1}
                canRemove={agentCount > 2}
                errors={form.formState.errors}
                currentRole={form.watch(`agents.${index}.role`)}
              />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <Card className="p-6">
            <p className="text-xs uppercase tracking-[0.22em] text-mist">Checklist</p>
            <ul className="mt-4 space-y-3 text-sm text-mist">
              <li>Ít nhất 2 agent, tối đa 5 agent cho MVP.</li>
              <li>Tên agent không được trùng nhau trong cùng topic.</li>
              <li>Chỉ Lead mới có quyền hỏi ngược Human khi đang chạy run.</li>
              <li>Prompt agent sẽ bị khóa sau message đầu tiên.</li>
            </ul>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-display text-xl font-semibold text-ink">Thêm agent</p>
                <p className="mt-2 text-sm text-mist">Dùng các role khác nhau để tránh mọi agent nói cùng một kiểu.</p>
              </div>
              <Button
                variant="secondary"
                type="button"
                disabled={agentCount >= 5}
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
                Thêm card
              </Button>
            </div>

            <div className="mt-5 grid gap-3">
              {AGENT_ROLE_OPTIONS.map((option) => (
                <div key={option.value} className="rounded-2xl border border-line/20 bg-white/[0.04] p-4">
                  <p className="font-medium text-ink">{option.label}</p>
                  <p className="mt-1 text-sm text-mist">{roleHints[option.value]}</p>
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
            <Button type="submit" loading={createTopicMutation.isPending} disabled={!form.formState.isValid}>
              Tạo topic và vào workspace
            </Button>
          </div>
        </div>
      </form>
    </SiteShell>
  );
}
