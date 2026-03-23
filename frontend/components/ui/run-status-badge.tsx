import { Badge } from '@/components/ui/badge';
import { formatRunStatus } from '@/lib/format';
import { RunStatus } from '@/types/topic';

export function RunStatusBadge({ status }: { status: RunStatus | null | undefined }) {
  const tone =
    status === 'running'
      ? 'accent'
      : status === 'waiting_human'
        ? 'warning'
        : status === 'completed'
          ? 'success'
          : status === 'failed' || status === 'cancelled'
            ? 'danger'
            : 'default';

  return <Badge tone={tone}>{formatRunStatus(status)}</Badge>;
}
