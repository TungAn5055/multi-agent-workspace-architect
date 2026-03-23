import { SiteShell } from '@/components/layout/site-shell';
import { Spinner } from '@/components/ui/spinner';

export default function RootLoading() {
  return (
    <SiteShell title="Đang tải" subtitle="Frontend đang hydrate route và chuẩn bị dữ liệu ban đầu.">
      <div className="flex min-h-[55vh] items-center justify-center">
        <Spinner className="h-10 w-10" />
      </div>
    </SiteShell>
  );
}
