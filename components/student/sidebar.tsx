'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  GraduationCap,
  LayoutDashboard,
  BarChart3,
  FileText,
  Target,
  Bell,
  Camera,
  CalendarDays,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';

const sectionItems = [
  { tab: 'attendance', label: 'Attendance', icon: BarChart3 },
  { tab: 'analytics', label: 'Analytics', icon: BarChart3 },
  { tab: 'marks', label: 'Marks', icon: FileText },
  { tab: 'cgpa', label: 'CGPA', icon: Target },
  { tab: 'notifications', label: 'Notifications', icon: Bell },
];

export function StudentSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, logout } = useAuth();

  const activeTab = searchParams.get('tab') || 'attendance';

  const handleLogout = () => {
    logout();
    router.push('/student/login');
  };

  const isDashboard = pathname === '/student/dashboard';
  const isRegisterFace = pathname === '/student/register-face';
  const isTimetable = pathname === '/student/timetable';

  return (
    <>
    <aside className="fixed left-0 top-0 hidden h-screen w-64 bg-[#1E1B4B] md:flex flex-col z-40 border-r border-white/10">
      <div className="p-6 border-b border-white/10">
        <Link href="/student/dashboard" className="flex items-center gap-2">
          <GraduationCap className="w-8 h-8 text-[#A78BFA]" />
          <span className="text-white font-bold text-xl">FaceAttend</span>
        </Link>
      </div>

      <div className="mx-4 mt-4 p-3 rounded-lg bg-white/5 border border-white/10">
        <p className="text-white text-sm font-medium truncate">{user?.name ?? 'Student'}</p>
        <p className="text-[#C4B5FD] text-xs font-mono mt-1">{user?.usn ?? '—'}</p>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        <Link
          href="/student/dashboard"
          className={cn(
            'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all mb-2',
            isDashboard && !searchParams.get('tab')
              ? 'bg-[#7C3AED]/30 text-[#E9D5FF]'
              : 'text-gray-400 hover:text-white hover:bg-white/5',
          )}
        >
          <LayoutDashboard className="w-5 h-5" />
          Dashboard
        </Link>
        <Link
          href="/student/timetable"
          className={cn(
            'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all',
            isTimetable
              ? 'bg-[#7C3AED]/30 text-[#E9D5FF] border-l-4 border-[#A78BFA] -ml-1 pl-5'
              : 'text-gray-400 hover:text-white hover:bg-white/5',
          )}
        >
          <CalendarDays className="w-5 h-5" />
          Timetable
        </Link>
        {sectionItems.map((item) => (
          <Link
            key={item.tab}
            href={`/student/dashboard?tab=${item.tab}`}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all',
              isDashboard && activeTab === item.tab
                ? 'bg-[#7C3AED]/30 text-[#E9D5FF] border-l-4 border-[#A78BFA] -ml-1 pl-5'
                : 'text-gray-400 hover:text-white hover:bg-white/5',
            )}
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </Link>
        ))}
        <Link
          href="/student/register-face"
          className={cn(
            'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all',
            isRegisterFace
              ? 'bg-[#7C3AED]/30 text-[#E9D5FF] border-l-4 border-[#A78BFA] -ml-1 pl-5'
              : 'text-gray-400 hover:text-white hover:bg-white/5',
          )}
        >
          <Camera className="w-5 h-5" />
          Register Face
        </Link>
      </nav>

      <div className="p-4 border-t border-white/10">
        <button
          type="button"
          onClick={handleLogout}
          className="flex min-h-11 items-center gap-3 w-full px-4 py-3 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 text-sm font-medium"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </aside>

    <nav className="fixed inset-x-0 bottom-0 z-50 flex md:hidden items-center gap-1 overflow-x-auto border-t border-white/10 bg-[#1E1B4B] px-2 py-2">
      <Link
        href="/student/dashboard"
        title="Dashboard"
        aria-label="Dashboard"
        className={cn(
          'flex min-h-11 min-w-11 items-center justify-center rounded-xl text-gray-400',
          isDashboard && !searchParams.get('tab') && 'bg-[#7C3AED]/30 text-[#E9D5FF]',
        )}
      >
        <LayoutDashboard className="w-5 h-5" />
      </Link>
      <Link
        href="/student/timetable"
        title="Timetable"
        aria-label="Timetable"
        className={cn(
          'flex min-h-11 min-w-11 items-center justify-center rounded-xl text-gray-400',
          isTimetable && 'bg-[#7C3AED]/30 text-[#E9D5FF]',
        )}
      >
        <CalendarDays className="w-5 h-5" />
      </Link>
      {sectionItems.map((item) => (
        <Link
          key={item.tab}
          href={`/student/dashboard?tab=${item.tab}`}
          title={item.label}
          aria-label={item.label}
          className={cn(
            'flex min-h-11 min-w-11 items-center justify-center rounded-xl text-gray-400',
            isDashboard && activeTab === item.tab && 'bg-[#7C3AED]/30 text-[#E9D5FF]',
          )}
        >
          <item.icon className="w-5 h-5" />
        </Link>
      ))}
      <Link
        href="/student/register-face"
        title="Register Face"
        aria-label="Register Face"
        className={cn(
          'flex min-h-11 min-w-11 items-center justify-center rounded-xl text-gray-400',
          isRegisterFace && 'bg-[#7C3AED]/30 text-[#E9D5FF]',
        )}
      >
        <Camera className="w-5 h-5" />
      </Link>
      <button
        type="button"
        title="Logout"
        aria-label="Logout"
        onClick={handleLogout}
        className="flex min-h-11 min-w-11 items-center justify-center rounded-xl text-gray-400 hover:bg-red-500/10 hover:text-red-400"
      >
        <LogOut className="w-5 h-5" />
      </button>
    </nav>
    </>
  );
}
