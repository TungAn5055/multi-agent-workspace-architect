'use client';

import { SiteShell } from '@/components/layout/site-shell';
import { TopicListCard } from '@/components/topic-list/topic-list-card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Spinner } from '@/components/ui/spinner';
import { useTopicsQuery } from '@/features/topics/topic-queries';

export function TopicListPage() {
  const topicsQuery = useTopicsQuery();

  return (
    <SiteShell
      title="Danh sách topic"
      subtitle="Mỗi topic là một workspace độc lập để Human cấu hình đội agent, provider và model routing."
    >
      <div className="mb-6 flex items-center justify-between gap-3">
        <div></div>
        <Button href="/topics/new">Tạo topic mới</Button>
      </div>

      {topicsQuery.isLoading ? (
        <div className="flex min-h-[240px] items-center justify-center">
          <Spinner className="h-8 w-8" />
        </div>
      ) : topicsQuery.isError ? (
        <EmptyState
          title="Không tải được danh sách topic"
          description="Kiểm tra backend đang chạy và biến NEXT_PUBLIC_API_BASE_URL đã trỏ đúng tới service NestJS."
          action={
            <Button onClick={() => topicsQuery.refetch()}>
              Thử lại
            </Button>
          }
        />
      ) : topicsQuery.data && topicsQuery.data.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {topicsQuery.data.map((topic) => (
            <TopicListCard key={topic.id} topic={topic} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="Chưa có topic nào"
          description="Tạo một workspace mới với ít nhất 2 agent để bắt đầu thảo luận nhiều vai trò."
          action={<Button href="/topics/new">Tạo topic đầu tiên</Button>}
        />
      )}
    </SiteShell>
  );
}
