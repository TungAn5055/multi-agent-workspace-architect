'use client';

import * as React from 'react';
import Link from 'next/link';

import { cn } from '@/lib/cn';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
  href?: string;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-accent text-white shadow-[0_10px_30px_rgba(241,108,59,0.35)] hover:bg-[#ff834f]',
  secondary: 'bg-panel/80 text-ink ring-1 ring-line/40 hover:bg-panel',
  ghost: 'bg-transparent text-mist hover:bg-white/5 hover:text-ink',
  danger: 'bg-danger/90 text-white hover:bg-danger',
};

export function Button({
  className,
  variant = 'primary',
  loading = false,
  href,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const classes = cn(
    'inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60',
    variantClasses[variant],
    className,
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button
      className={classes}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/25 border-t-white" /> : null}
      {children}
    </button>
  );
}
