import type { Metadata } from 'next';
import { Funnel_Sans } from 'next/font/google';

import '@/app/globals.css';

import { Providers } from '@/app/providers';

const appFont = Funnel_Sans({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-funnel-sans',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Multi-Agent Workspace',
  description: 'Workspace thảo luận đa agent cho MVP tiếng Việt.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className={`${appFont.className} ${appFont.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
