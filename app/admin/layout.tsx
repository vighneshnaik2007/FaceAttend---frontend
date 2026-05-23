'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AdminSidebar } from '@/components/admin/sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/auth-context';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (isLoading || isLoginPage) return;
    if (!isAuthenticated || user?.role !== 'admin') {
      router.replace('/');
    }
  }, [isLoading, isAuthenticated, user, router, isLoginPage]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (isLoading || !isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Skeleton className="h-24 w-72 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      <div className="fixed right-4 top-4 z-50 hidden md:block">
        <ThemeToggle />
      </div>
      <div className="min-h-screen pt-16 md:ml-64 md:pt-0">{children}</div>
    </div>
  );
}
