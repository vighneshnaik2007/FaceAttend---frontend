'use client';

import { LogOut, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

interface TeacherHeaderProps {
  title?: string;
}

export function TeacherHeader({ title = 'Teacher Dashboard' }: TeacherHeaderProps) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const subjectCode = user?.subject_code ?? user?.assignedSubject?.code ?? '';
  const subjectName = user?.assignedSubject?.name ?? '';

  const handleLogout = () => {
    logout();
    router.push('/teacher/login');
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <header className="bg-card border-b border-border sticky top-0 z-30">
      <div className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#1E293B]">{title}</h1>
          <p className="text-sm text-[#64748B] mt-0.5">{currentDate}</p>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="text-sm font-medium text-[#1E293B]">{user?.name ?? 'Teacher'}</span>
            {subjectCode && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2563EB]/10 text-[#2563EB] text-sm font-medium">
                <BookOpen className="w-3.5 h-3.5" />
                {subjectCode}
                {subjectName ? ` — ${subjectName}` : ''}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button
            variant="outline"
            onClick={handleLogout}
            className="text-[#EF4444] border-[#EF4444]/30 hover:bg-[#EF4444]/10 shrink-0"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
