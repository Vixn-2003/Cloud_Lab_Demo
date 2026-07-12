'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from '@/src/i18n/navigation';
import { useAuthStore } from '@/lib/auth-store';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, initialized, initialize } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (mounted && initialized) {
      if (!isAuthenticated && pathname !== '/login') {
        router.push('/login');
      } else if (isAuthenticated && pathname === '/login') {
        router.push('/dashboard');
      }
    }
  }, [mounted, initialized, isAuthenticated, pathname, router]);

  // Tránh render nội dung khi chưa mount hoặc store chưa khởi tạo xong
  if (!mounted || !initialized) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#0a0a0f] text-foreground dark">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground/80 animate-pulse">Đang kết nối hệ thống Cloud Lab...</p>
        </div>
      </div>
    );
  }

  // Đang redirect về login
  if (!isAuthenticated && pathname !== '/login') {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#0a0a0f] text-foreground dark">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground/80 animate-pulse">Yêu cầu đăng nhập. Đang chuyển hướng...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
