'use client';

import { ReactNode, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/cn';

export function Modal({
  open,
  title,
  description,
  onClose,
  panelClassName,
  children,
}: {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  panelClassName?: string;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) {
      return;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/75 p-4 py-6 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <Card
        className={cn('w-full max-w-lg p-6', panelClassName)}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h3 className="font-display text-xl font-semibold text-ink">{title}</h3>
            {description ? <p className="mt-2 text-sm text-mist">{description}</p> : null}
          </div>
          <Button variant="ghost" onClick={onClose}>
            Đóng
          </Button>
        </div>
        {children}
      </Card>
    </div>
  );
}
