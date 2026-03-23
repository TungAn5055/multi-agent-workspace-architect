import { Card } from '@/components/ui/card';
import { cn } from '@/lib/cn';

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn('border-dashed border-line/30 bg-white/[0.03] p-8 text-center', className)}>
      <div className="mx-auto max-w-md space-y-3">
        <p className="font-display text-2xl font-semibold text-ink">{title}</p>
        <p className="text-sm leading-6 text-mist">{description}</p>
        {action ? <div className="pt-2">{action}</div> : null}
      </div>
    </Card>
  );
}
