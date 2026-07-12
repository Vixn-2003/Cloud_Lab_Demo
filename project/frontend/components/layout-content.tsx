'use client';

import { usePathname } from '@/src/i18n/navigation';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { PageBreadcrumb } from '@/components/page-breadcrumb';
import { Separator } from '@/components/ui/separator';

export function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  if (isLoginPage) {
    return <main className="min-h-screen bg-[#06060a]">{children}</main>;
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4 bg-background/50 backdrop-blur-md sticky top-0 z-50">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <PageBreadcrumb />
        </header>
        <main className="flex-1 overflow-auto bg-background/30">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
