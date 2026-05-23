'use client';

import dynamic from 'next/dynamic';
import { use, Suspense } from 'react';
import { LabWorkspaceSkeleton } from './lab-workspace-skeleton';

const LabWorkspaceContent = dynamic(
  () => import('./lab-workspace-content').then((mod) => mod.LabWorkspaceContent),
  {
    ssr: false,
    loading: () => <LabWorkspaceSkeleton />,
  }
);

interface PageProps {
  params: Promise<{ labId: string }>;
}

export default function LabWorkspacePage({ params }: PageProps) {
  const { labId } = use(params);

  return (
    <div className="h-[calc(100vh-3.5rem)] overflow-hidden">
      <Suspense fallback={<LabWorkspaceSkeleton />}>
        <LabWorkspaceContent labId={labId} />
      </Suspense>
    </div>
  );
}
