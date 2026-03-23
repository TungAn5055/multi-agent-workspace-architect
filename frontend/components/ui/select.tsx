import * as React from 'react';

import { cn } from '@/lib/cn';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, children, ...props },
  ref,
) {
  return (
    <select
      ref={ref}
      className={cn(
        'w-full rounded-2xl border border-line/35 bg-panel px-4 py-3 text-sm text-ink outline-none transition focus:border-accent/70',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
});
