import { Inter, JetBrains_Mono } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { Toaster } from 'sonner';
import { notFound } from 'next/navigation';
import { routing } from '@/src/i18n/routing';

import { AuthGuard } from '@/components/auth-guard';
import { LayoutContent } from '@/components/layout-content';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;

  // Validate locale
  if (!routing.locales.includes(locale as 'vi' | 'en')) {
    notFound();
  }

  // Enable static rendering
  setRequestLocale(locale);

  // Get messages for the current locale
  const messages = await getMessages();

  return (
    <html lang={locale} className={`${inter.variable} ${jetbrainsMono.variable} dark bg-background`}>
      <body className="font-sans antialiased min-h-screen">
        <NextIntlClientProvider messages={messages}>
          <AuthGuard>
            <LayoutContent>
              {children}
            </LayoutContent>
          </AuthGuard>
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
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

