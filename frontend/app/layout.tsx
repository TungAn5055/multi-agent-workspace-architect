import type { Metadata } from 'next';
import { Source_Sans_3, Source_Serif_4 } from 'next/font/google';

import '@/app/globals.css';

import { Providers } from '@/app/providers';

const displayFont = Source_Sans_3({
  subsets: ['latin', 'latin-ext', 'vietnamese'],
  variable: '--font-display',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const bodyFont = Source_Serif_4({
  subsets: ['latin', 'latin-ext', 'vietnamese'],
  variable: '--font-body',
  weight: 'variable',
  style: ['normal', 'italic'],
  axes: ['opsz'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Multi-Agent Workspace',
  description: 'Workspace thảo luận đa agent cho MVP tiếng Việt.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body suppressHydrationWarning className={`${displayFont.variable} ${bodyFont.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
