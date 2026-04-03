'use client';

import { ConfirmAction } from '@/components/ui/confirm-action';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Divider } from '@/components/ui/divider';
import { RunStatusBadge } from '@/components/ui/run-status-badge';
import { getProviderLabel } from '@/lib/constants';
import { formatRelativeDate } from '@/lib/format';
import { TopicDetail } from '@/types/topic';

export function TopicSidebar({
  topic,
  messageCount,
  onArchive,
}: {
  topic: TopicDetail;
  messageCount: number;
  onArchive: () => Promise<void>;
}) {
  return (
    <div className="space-y-4 xl:sticky xl:top-5">
      <Card className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-mist">Topic</p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-ink">{topic.title}</h2>
          </div>
          <RunStatusBadge status={topic.activeRun?.status ?? null} />
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl border border-line/20 bg-white/[0.04] p-3">
            <p className="text-xs uppercase tracking-[0.22em] text-mist">Messages</p>
            <p className="mt-2 text-lg font-semibold text-ink">{messageCount}</p>
          </div>
          <div className="rounded-2xl border border-line/20 bg-white/[0.04] p-3">
            <p className="text-xs uppercase tracking-[0.22em] text-mist">Cập nhật</p>
            <p className="mt-2 text-sm font-medium text-ink">{formatRelativeDate(topic.updatedAt)}</p>
          </div>
        </div>

        <Divider className="my-5" />

        <div className="space-y-2 text-sm text-mist">
          <p>
            Prompt agent: <span className="font-medium text-ink">{topic.hasHistory ? 'Đã khóa' : 'Có thể chỉnh trước history'}</span>
          </p>
          <p>
            Rule: <span className="font-medium text-ink">chỉ Lead được hỏi ngược Human</span>
          </p>
          <p>
            Status topic: <span className="font-medium text-ink">{topic.status}</span>
          </p>
        </div>

        <div className="mt-5">
          <ConfirmAction
            disabled={topic.status === 'archived'}
            triggerLabel={topic.status === 'archived' ? 'Đã archive' : 'Archive topic'}
            title="Archive topic"
            description="Archive giúp khóa topic khỏi các run mới theo policy backend hiện tại."
            confirmLabel="Archive"
            onConfirm={onArchive}
          />
        </div>
      </Card>

      <Card className="p-5">
        <p className="text-xs uppercase tracking-[0.22em] text-mist">Agent roster</p>
        <div className="mt-4 space-y-3">
          {topic.agents.map((agent) => (
            <div key={agent.id} className="rounded-2xl border border-line/20 bg-white/[0.04] p-4">
              <div className="flex items-center gap-2">
                <p className="font-medium text-ink">{agent.name}</p>
                {agent.role === 'lead' ? <Badge tone="accent">Lead</Badge> : null}
                {agent.provider || agent.model ? <Badge tone="default">Override</Badge> : null}
              </div>
              <p className="mt-2 text-xs uppercase tracking-[0.18em] text-mist">{agent.role}</p>
              <p className="mt-2 text-xs text-mist">
                {agent.provider ? getProviderLabel(agent.provider) : getProviderLabel(topic.sharedProvider)} ·{' '}
                {agent.model ?? topic.sharedModel}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
