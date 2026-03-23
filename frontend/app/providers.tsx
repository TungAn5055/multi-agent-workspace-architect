'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

import { ToastViewport } from '@/components/ui/toast-viewport';
import { makeQueryClient } from '@/lib/query-client';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => makeQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ToastViewport />
    </QueryClientProvider>
  );
}
