'use client';

import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

interface StudentHeaderProps {
  title?: string;
}

export function StudentHeader({ title = 'Student Dashboard' }: StudentHeaderProps) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/student/login');
  };

  return (
    <header className="bg-card border-b border-border sticky top-0 z-30">
      <div className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#1E293B]">{title}</h1>
          <p className="text-sm text-[#64748B] mt-1">
            <span className="font-medium text-[#1E293B]">{user?.name ?? 'Student'}</span>
            {user?.usn && (
              <span className="ml-2 font-mono text-[#7C3AED]">{user.usn}</span>
            )}
            {user?.branch && (
              <span className="ml-2 text-[#64748B]">· {user.branch}</span>
            )}
          </p>
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
