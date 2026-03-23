import { initials } from '@/lib/format';

export function Avatar({
  name,
  tone = 'agent',
}: {
  name: string;
  tone?: 'human' | 'agent' | 'system';
}) {
  const toneClass =
    tone === 'human'
      ? 'from-accent to-[#ffca85]'
      : tone === 'system'
        ? 'from-slate-600 to-slate-400'
        : 'from-[#5ca0ff] to-[#6af0d7]';

  return (
    <span
      className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br ${toneClass} text-xs font-semibold text-slate-950`}
    >
      {initials(name)}
    </span>
  );
}
