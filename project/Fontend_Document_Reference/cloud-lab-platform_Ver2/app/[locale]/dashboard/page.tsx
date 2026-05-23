import { Suspense } from 'react';
import { setRequestLocale } from 'next-intl/server';
import { DashboardContent } from './dashboard-content';
import { DashboardSkeleton } from './dashboard-skeleton';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function DashboardPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="animate-fade-in-up p-6">
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}
