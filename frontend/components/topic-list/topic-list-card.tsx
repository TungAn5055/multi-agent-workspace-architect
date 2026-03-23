import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

import { Card } from '@/components/ui/card';
import { RunStatusBadge } from '@/components/ui/run-status-badge';
import { formatRelativeDate } from '@/lib/format';
import { TopicSummary } from '@/types/topic';

export function TopicListCard({ topic }: { topic: TopicSummary }) {
  return (
    <Link href={`/topics/${topic.id}`} className="group block">
      <Card className="h-full p-5 transition hover:-translate-y-1 hover:border-accent/30 hover:bg-white/[0.05]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-mist">
              {topic.agentCount} agent · model {topic.sharedModel}
            </p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-ink group-hover:text-white">
              {topic.title}
            </h2>
            {topic.status === 'archived' ? (
              <div className="mt-3">
                <Badge tone="warning">Archive</Badge>
              </div>
            ) : null}
          </div>
          <RunStatusBadge status={topic.status === 'archived' ? 'cancelled' : topic.latestRunStatus} />
        </div>
        <div className="mt-5 flex flex-wrap gap-3 text-sm text-mist">
          <span>{topic.hasHistory ? 'Đã có hội thoại' : 'Chưa khởi động'}</span>
          <span>•</span>
          <span>Cập nhật {formatRelativeDate(topic.updatedAt)}</span>
          <span>•</span>
          <span>{topic.status === 'archived' ? 'Đã archive' : 'Đang hoạt động'}</span>
        </div>
      </Card>
    </Link>
  );
}
