'use client';

import { useEffect } from 'react';

import { SiteShell } from '@/components/layout/site-shell';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { useToastStore } from '@/stores/toast-store';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const pushToast = useToastStore((state) => state.push);

  useEffect(() => {
    pushToast({
      title: 'Frontend gặp lỗi',
      description: error.message,
      tone: 'danger',
    });
  }, [error.message, pushToast]);

  return (
    <SiteShell
      title="Đã xảy ra lỗi giao diện"
      subtitle="App Router đã chặn lỗi ở route hiện tại để không làm trắng toàn bộ ứng dụng."
    >
      <EmptyState
        title="Không render được trang này"
        description={error.message}
        action={<Button onClick={reset}>Thử render lại</Button>}
      />
    </SiteShell>
  );
}
