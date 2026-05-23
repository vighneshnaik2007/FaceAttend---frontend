'use client';

import { ReactNode, Suspense, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { StudentSidebar } from '@/components/student/sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/auth-context';

export default function StudentLayout({ children }: { children: ReactNode }) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === '/student/login';

  useEffect(() => {
    if (isLoading) return;
    if (!isLoginPage && (!isAuthenticated || user?.role !== 'student')) {
      router.replace('/student/login');
    }
    if (isLoginPage && isAuthenticated && user?.role === 'student') {
      router.replace('/student/dashboard');
    }
  }, [isLoading, isAuthenticated, user, isLoginPage, router]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (isLoading || !isAuthenticated || user?.role !== 'student') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Skeleton className="h-24 w-72 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Suspense fallback={<div className="hidden md:block w-64 fixed left-0 top-0 h-screen bg-[#1E1B4B]" />}>
        <StudentSidebar />
      </Suspense>
      <div className="md:ml-64">{children}</div>
    </div>
  );
}
