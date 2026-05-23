'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { CalendarDays, LayoutDashboard, Settings, LogOut, Menu, Shield, X, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';

const navItems = [
  { href: '/admin/dashboard', label: 'Semesters', icon: LayoutDashboard },
  { href: '/admin/timetable', label: 'Timetable', icon: CalendarDays },
  { href: '/admin/activity-log', label: 'Activity Log', icon: Clock },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const nav = (
    <>
      <div className="p-6 border-b border-white/10">
        <Link href="/admin/dashboard" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <Shield className="w-8 h-8 text-[#2563EB]" />
          <div>
            <span className="text-white font-bold text-lg block">FaceAttend</span>
            <span className="text-gray-500 text-xs">Admin Panel</span>
          </div>
        </Link>
      </div>

      <div className="mx-4 mt-4 p-3 rounded-lg bg-white/5 border border-white/10">
        <p className="text-white text-sm font-medium truncate">{user?.name || 'Administrator'}</p>
        <p className="text-gray-500 text-xs truncate">{user?.email}</p>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1">
        {navItems.map((item) => {
          const active =
            pathname === item.href ||
            (item.href === '/admin/dashboard' && pathname.startsWith('/admin/semester'));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                'flex min-h-11 items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all',
                active
                  ? 'bg-[#2563EB]/20 text-[#60A5FA] border-l-4 border-[#2563EB] -ml-1 pl-5'
                  : 'text-gray-400 hover:text-white hover:bg-white/5',
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
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
    </>
  );

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between border-b border-border bg-card px-4 md:hidden">
        <Button variant="outline" size="icon" onClick={() => setOpen(true)} aria-label="Open menu">
          <Menu className="w-5 h-5" />
        </Button>
        <Link href="/admin/dashboard" className="flex items-center gap-2 text-foreground">
          <Shield className="w-6 h-6 text-[#2563EB]" />
          <span className="font-bold">FaceAttend</span>
        </Link>
        <ThemeToggle />
      </div>

      {open && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 min-h-11 bg-black/50"
            onClick={() => setOpen(false)}
          />
          <aside className="relative h-full w-72 max-w-[85vw] bg-[#0F172A] flex flex-col border-r border-white/10">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-3 top-3 text-white hover:bg-white/10"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </Button>
            {nav}
          </aside>
        </div>
      )}

      <aside className="fixed left-0 top-0 hidden h-screen w-64 bg-[#0F172A] md:flex flex-col z-40 border-r border-white/10">
        {nav}
      </aside>
    </>
  );
}
