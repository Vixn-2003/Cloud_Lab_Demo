'use client';

import { Suspense } from 'react';
import { LabBrowserContent } from './lab-browser-content';
import { LabBrowserSkeleton } from './lab-browser-skeleton';

export default function LabsPage() {
  return (
    <div className="animate-fade-in-up">
      <Suspense fallback={<LabBrowserSkeleton />}>
        <LabBrowserContent />
      </Suspense>
    </div>
  );
}
