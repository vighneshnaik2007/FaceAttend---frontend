'use client';

import { ReactNode, Suspense, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { TeacherSidebar } from '@/components/teacher/sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/auth-context';

export default function TeacherLayout({ children }: { children: ReactNode }) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === '/teacher/login';

  useEffect(() => {
    if (isLoading) return;
    if (!isLoginPage && (!isAuthenticated || user?.role !== 'teacher')) {
      router.replace('/teacher/login');
    }
    if (isLoginPage && isAuthenticated && user?.role === 'teacher') {
      router.replace('/teacher/dashboard');
    }
  }, [isLoading, isAuthenticated, user, isLoginPage, router]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (isLoading || !isAuthenticated || user?.role !== 'teacher') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Skeleton className="h-24 w-72 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Suspense fallback={<div className="hidden md:block w-64 fixed left-0 top-0 h-screen bg-[#0F172A]" />}>
        <TeacherSidebar />
      </Suspense>
      <div className="md:ml-64">{children}</div>
    </div>
  );
}
