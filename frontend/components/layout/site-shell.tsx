import Link from 'next/link';

export function SiteShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1480px] flex-col px-4 pb-8 pt-5 sm:px-6 lg:px-8">
      <header className="mb-8 flex flex-col gap-5 border-b border-white/6 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Link href="/topics" className="inline-flex items-center rounded-full border border-line/20 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.28em] text-mist">
            Multi-Agent Workspace
          </Link>
          <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
            {title}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-mist">{subtitle}</p>
        </div>
        <nav className="flex items-center gap-3 text-sm text-mist">
          <Link href="/topics" className="rounded-full px-3 py-2 hover:bg-white/5 hover:text-ink">
            Danh sách topic
          </Link>
          <Link href="/topics/new" className="rounded-full px-3 py-2 hover:bg-white/5 hover:text-ink">
            Tạo topic
          </Link>
          <Link href="/health" className="rounded-full px-3 py-2 hover:bg-white/5 hover:text-ink">
            Health
          </Link>
        </nav>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
