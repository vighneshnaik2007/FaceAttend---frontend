'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  GraduationCap,
  LayoutDashboard,
  ClipboardList,
  BarChart3,
  FileEdit,
  AlertTriangle,
  Send,
  LogOut,
  BookOpen,
  CalendarDays,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';

const sectionItems = [
  { tab: 'take', label: 'Take Attendance', icon: ClipboardList },
  { tab: 'view', label: 'View Attendance', icon: BarChart3 },
  { tab: 'marks', label: 'Marks Management', icon: FileEdit },
  { tab: 'analytics', label: 'Analytics', icon: BarChart3 },
  { tab: 'defaulters', label: 'Defaulters', icon: AlertTriangle },
  { tab: 'notifications', label: 'Notifications Sent', icon: Send },
];

export function TeacherSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, logout } = useAuth();

  const activeTab = searchParams.get('tab') || 'take';
  const subjectCode = user?.subject_code ?? user?.assignedSubject?.code ?? '';
  const subjectName = user?.assignedSubject?.name ?? '';

  const handleLogout = () => {
    logout();
    router.push('/teacher/login');
  };

  const isDashboard = pathname === '/teacher/dashboard';
  const isTimetable = pathname === '/teacher/timetable';

  return (
    <>
    <aside className="fixed left-0 top-0 hidden h-screen w-64 bg-[#0F172A] md:flex flex-col z-40 border-r border-white/10">
      <div className="p-6 border-b border-white/10">
        <Link href="/teacher/dashboard" className="flex items-center gap-2">
          <GraduationCap className="w-8 h-8 text-[#2563EB]" />
          <span className="text-white font-bold text-xl">FaceAttend</span>
        </Link>
      </div>

      <div className="mx-4 mt-4 p-3 rounded-lg bg-white/5 border border-white/10">
        <p className="text-white text-sm font-medium truncate">{user?.name ?? 'Teacher'}</p>
        {subjectCode && (
          <p className="text-[#60A5FA] text-xs mt-1 flex items-center gap-1">
            <BookOpen className="w-3 h-3 shrink-0" />
            <span className="truncate">
              {subjectCode}
              {subjectName ? ` · ${subjectName}` : ''}
            </span>
          </p>
        )}
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        <Link
          href="/teacher/dashboard"
          className={cn(
            'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all mb-2',
            isDashboard && !searchParams.get('tab')
              ? 'bg-[#2563EB]/20 text-[#60A5FA]'
              : 'text-gray-400 hover:text-white hover:bg-white/5',
          )}
        >
          <LayoutDashboard className="w-5 h-5" />
          Dashboard
        </Link>
        <Link
          href="/teacher/timetable"
          className={cn(
            'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all mb-2',
            isTimetable
              ? 'bg-[#2563EB]/20 text-[#60A5FA] border-l-4 border-[#2563EB] -ml-1 pl-5'
              : 'text-gray-400 hover:text-white hover:bg-white/5',
          )}
        >
          <CalendarDays className="w-5 h-5" />
          Timetable
        </Link>
        {sectionItems.map((item) => (
          <Link
            key={item.tab}
            href={`/teacher/dashboard?tab=${item.tab}`}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all',
              isDashboard && activeTab === item.tab
                ? 'bg-[#2563EB]/20 text-[#60A5FA] border-l-4 border-[#2563EB] -ml-1 pl-5'
                : 'text-gray-400 hover:text-white hover:bg-white/5',
            )}
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </Link>
        ))}
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

    <nav className="fixed inset-x-0 bottom-0 z-50 flex md:hidden items-center gap-1 overflow-x-auto border-t border-white/10 bg-[#0F172A] px-2 py-2">
      <Link
        href="/teacher/dashboard"
        title="Dashboard"
        aria-label="Dashboard"
        className={cn(
          'flex min-h-11 min-w-11 items-center justify-center rounded-xl text-gray-400',
          isDashboard && !searchParams.get('tab') && 'bg-[#2563EB]/20 text-[#60A5FA]',
        )}
      >
        <LayoutDashboard className="w-5 h-5" />
      </Link>
      <Link
        href="/teacher/timetable"
        title="Timetable"
        aria-label="Timetable"
        className={cn(
          'flex min-h-11 min-w-11 items-center justify-center rounded-xl text-gray-400',
          isTimetable && 'bg-[#2563EB]/20 text-[#60A5FA]',
        )}
      >
        <CalendarDays className="w-5 h-5" />
      </Link>
      {sectionItems.map((item) => (
        <Link
          key={item.tab}
          href={`/teacher/dashboard?tab=${item.tab}`}
          title={item.label}
          aria-label={item.label}
          className={cn(
            'flex min-h-11 min-w-11 items-center justify-center rounded-xl text-gray-400',
            isDashboard && activeTab === item.tab && 'bg-[#2563EB]/20 text-[#60A5FA]',
          )}
        >
          <item.icon className="w-5 h-5" />
        </Link>
      ))}
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
