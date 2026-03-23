import type { Metadata } from 'next';
import { IBM_Plex_Sans, Space_Grotesk } from 'next/font/google';

import '@/app/globals.css';

import { Providers } from '@/app/providers';

const bodyFont = IBM_Plex_Sans({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-plex-sans',
  weight: ['400', '500', '600', '700'],
});

const displayFont = Space_Grotesk({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-space-grotesk',
  weight: ['500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Multi-Agent Workspace',
  description: 'Workspace thảo luận đa agent cho MVP tiếng Việt.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className={`${bodyFont.variable} ${displayFont.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
