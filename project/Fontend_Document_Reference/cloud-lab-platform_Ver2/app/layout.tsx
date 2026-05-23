import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { Toaster } from 'sonner';
import './globals.css';

import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { PageBreadcrumb } from '@/components/page-breadcrumb';
import { Separator } from '@/components/ui/separator';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
});

export const metadata: Metadata = {
  title: 'Cloud Lab — Enterprise Lab Platform',
  description: 'Enterprise-grade online lab platform for academic excellence. Write code, run experiments, and submit for auto-grading.',
  generator: 'Next.js',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#0a0a0f',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} dark bg-background`}>
      <body className="font-sans antialiased min-h-screen">
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <PageBreadcrumb />
            </header>
            <main className="flex-1 overflow-auto">
              {children}
            </main>
          </SidebarInset>
        </SidebarProvider>
        <Toaster 
          theme="dark" 
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'oklch(0.16 0.005 285)',
              border: '1px solid oklch(0.28 0.01 285)',
              color: 'oklch(0.95 0 0)',
            },
          }}
        />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  );
}
