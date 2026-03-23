import { cn } from '@/lib/cn';

export function Divider({ className }: { className?: string }) {
  return <div className={cn('h-px w-full bg-gradient-to-r from-transparent via-line/35 to-transparent', className)} />;
}
