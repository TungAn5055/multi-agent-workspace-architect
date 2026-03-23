import { SiteShell } from '@/components/layout/site-shell';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';

export default function NotFound() {
  return (
    <SiteShell title="Không tìm thấy" subtitle="Route hoặc topic bạn mở hiện không tồn tại trong workspace này.">
      <EmptyState
        title="Không có dữ liệu để hiển thị"
        description="Kiểm tra lại đường dẫn hoặc quay về danh sách topic để mở một workspace hợp lệ."
        action={<Button href="/topics">Quay về danh sách topic</Button>}
      />
    </SiteShell>
  );
}
