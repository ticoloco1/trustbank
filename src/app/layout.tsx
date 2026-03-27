import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/layout/Providers';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'TrustBank — Mini Sites, Slugs & Video Paywall',
  description: 'Create your mini site, sell slugs, add YouTube paywall and list properties.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning needed because ThemeScript sets class before React hydrates
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
        {/* Apply saved theme BEFORE first paint to avoid flash */}
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            var t = JSON.parse(localStorage.getItem('tb-theme') || '{}');
            var dark = t.state ? t.state.dark : true;
            document.documentElement.classList.toggle('dark', dark !== false);
          } catch(e) {
            document.documentElement.classList.add('dark');
          }
        `}} />
      </head>
      <body>
        <Providers>
          {children}
          <Toaster richColors position="top-right" />
        </Providers>
      </body>
    </html>
  );
}
