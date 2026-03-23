import * as React from 'react';

import { cn } from '@/lib/cn';

export function Card({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-[28px] border border-line/20 bg-panel/85 shadow-panel backdrop-blur',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
