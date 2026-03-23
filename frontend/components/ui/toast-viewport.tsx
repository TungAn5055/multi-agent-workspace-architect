'use client';

import { useEffect } from 'react';

import { useToastStore } from '@/stores/toast-store';

export function ToastViewport() {
  const items = useToastStore((state) => state.items);
  const remove = useToastStore((state) => state.remove);

  useEffect(() => {
    if (items.length === 0) {
      return;
    }

    const timers = items.map((item) =>
      window.setTimeout(() => {
        remove(item.id);
      }, 4000),
    );

    return () => {
      for (const timer of timers) {
        window.clearTimeout(timer);
      }
    };
  }, [items, remove]);

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[60] flex w-full max-w-sm flex-col gap-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="pointer-events-auto rounded-2xl border border-line/30 bg-panel/95 p-4 shadow-panel"
        >
          <p className="font-medium text-ink">{item.title}</p>
          {item.description ? <p className="mt-1 text-sm text-mist">{item.description}</p> : null}
        </div>
      ))}
    </div>
  );
}
