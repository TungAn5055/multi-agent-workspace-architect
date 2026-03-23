import * as React from 'react';

import { cn } from '@/lib/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      className={cn(
        'w-full rounded-2xl border border-line/35 bg-white/5 px-4 py-3 text-sm text-ink placeholder:text-mist/70 outline-none transition focus:border-accent/70 focus:bg-white/[0.07]',
        className,
      )}
      {...props}
    />
  );
});
