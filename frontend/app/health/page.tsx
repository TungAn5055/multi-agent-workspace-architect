'use client';

import { useQuery } from '@tanstack/react-query';

import { SiteShell } from '@/components/layout/site-shell';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { api } from '@/lib/api-client';

export default function HealthPage() {
  const healthQuery = useQuery({
    queryKey: ['health'],
    queryFn: api.getHealth,
  });

  return (
    <SiteShell
      title="Health check"
      subtitle="Trang test nền để FE xác nhận đang gọi được backend thật bằng biến môi trường hiện tại."
    >
      <Card className="max-w-2xl p-6">
        {healthQuery.isLoading ? (
          <div className="flex min-h-32 items-center justify-center">
            <Spinner className="h-8 w-8" />
          </div>
        ) : healthQuery.isError ? (
          <div className="space-y-4">
            <p className="text-sm text-danger">Không thể gọi backend health endpoint.</p>
            <Button onClick={() => healthQuery.refetch()}>Thử lại</Button>
          </div>
        ) : (
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-[0.22em] text-mist">Status</dt>
              <dd className="mt-2 text-lg font-semibold text-ink">{healthQuery.data.status}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.22em] text-mist">Database</dt>
              <dd className="mt-2 text-lg font-semibold text-ink">{healthQuery.data.database}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.22em] text-mist">Redis</dt>
              <dd className="mt-2 text-lg font-semibold text-ink">{healthQuery.data.redis}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.22em] text-mist">Timestamp</dt>
              <dd className="mt-2 text-lg font-semibold text-ink">{healthQuery.data.timestamp}</dd>
            </div>
          </dl>
        )}
      </Card>
    </SiteShell>
  );
}
