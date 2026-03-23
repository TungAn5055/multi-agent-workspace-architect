'use client';

import { ConfirmAction } from '@/components/ui/confirm-action';
import { RunStatusBadge } from '@/components/ui/run-status-badge';
import { formatRunStatus } from '@/lib/format';
import { RunDetail, RunStatus } from '@/types/topic';

export function RunStatusBar({
  status,
  currentSpeaker,
  banner,
  runDetail,
  onStop,
}: {
  status: RunStatus | null;
  currentSpeaker: { agentName: string } | null;
  banner: string | null;
  runDetail: RunDetail | null | undefined;
  onStop: () => Promise<void>;
}) {
  const canStop = status === 'queued' || status === 'running' || status === 'waiting_human';

  return (
    <div className="rounded-[28px] border border-line/20 bg-white/[0.04] p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <RunStatusBadge status={status} />
            <p className="text-sm text-mist">
              {currentSpeaker
                ? `${currentSpeaker.agentName} đang nói`
                : `Trạng thái hiện tại: ${formatRunStatus(status)}`}
            </p>
          </div>
          <p className="text-sm leading-6 text-mist">
            {banner ??
              (status
                ? 'Dòng trạng thái này phản ánh lifecycle run và event stream gần nhất từ backend.'
                : 'Topic chưa có run active. Gửi message đầu tiên để khởi động.' )}
          </p>
          {runDetail?.stopReason ? (
            <p className="text-xs text-warning">Stop reason: {runDetail.stopReason}</p>
          ) : null}
        </div>

        {canStop ? (
          <ConfirmAction
            triggerLabel="Stop run"
            title="Dừng run hiện tại"
            description="Hệ thống sẽ chuyển run sang cancelled và không tạo thêm message mới sau đó."
            confirmLabel="Xác nhận dừng"
            onConfirm={onStop}
          />
        ) : null}
      </div>
    </div>
  );
}
