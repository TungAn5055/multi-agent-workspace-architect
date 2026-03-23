import * as React from 'react';

import { cn } from '@/lib/cn';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      className={cn(
        'min-h-[120px] w-full rounded-2xl border border-line/35 bg-white/5 px-4 py-3 text-sm text-ink placeholder:text-mist/70 outline-none transition focus:border-accent/70 focus:bg-white/[0.07]',
        className,
      )}
      {...props}
    />
  );
});
