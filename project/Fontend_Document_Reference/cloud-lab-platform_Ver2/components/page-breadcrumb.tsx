'use client';

import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/src/i18n/navigation';
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

export function PageBreadcrumb({ segments }: PageBreadcrumbProps) {
  const t = useTranslations('breadcrumb');
  const pathname = usePathname();

  const routeLabels: Record<string, string> = {
    dashboard: t('home'),
    labs: t('labs'),
    submissions: t('submissions'),
    workspace: t('workspace'),
    terminal: t('terminal'),
    settings: t('settings'),
  };

  // If custom segments are provided, use them
  if (segments && segments.length > 0) {
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboard">{t('home')}</Link>
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
            <BreadcrumbPage>{t('home')}</BreadcrumbPage>
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
            <Link href="/dashboard">{t('home')}</Link>
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
