'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

interface BreadcrumbSegment {
  label: string;
  href?: string;
}

interface PageBreadcrumbProps {
  segments?: BreadcrumbSegment[];
}

const routeLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  labs: 'Labs',
  submissions: 'My Submissions',
  workspace: 'Code Editor',
  terminal: 'Terminal',
  settings: 'Settings',
};

export function PageBreadcrumb({ segments }: PageBreadcrumbProps) {
  const pathname = usePathname();

  // If custom segments are provided, use them
  if (segments && segments.length > 0) {
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboard">Dashboard</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          {segments.map((segment, index) => (
            <span key={index} className="flex items-center gap-1.5">
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {index === segments.length - 1 || !segment.href ? (
                  <BreadcrumbPage>{segment.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={segment.href}>{segment.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </span>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    );
  }

  // Auto-generate from pathname
  const pathSegments = pathname.split('/').filter(Boolean);

  if (pathSegments.length === 0 || (pathSegments.length === 1 && pathSegments[0] === 'dashboard')) {
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>Dashboard</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/dashboard">Dashboard</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {pathSegments.map((segment, index) => {
          const isLast = index === pathSegments.length - 1;
          const href = '/' + pathSegments.slice(0, index + 1).join('/');
          const label = routeLabels[segment] || decodeURIComponent(segment);

          return (
            <span key={segment} className="flex items-center gap-1.5">
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={href}>{label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </span>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
