'use client';

import Link from 'next/link';
import { BookOpen, GraduationCap, Shield, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const roleCards = [
  {
    title: 'Admin Login',
    subtitle: 'System administrator only',
    description: 'Manage teachers, students, sections and system settings.',
    href: '/admin/login',
    icon: Shield,
    accent: '#2563EB',
    buttonClass: 'bg-[#2563EB] hover:bg-[#1D4ED8]',
    borderClass: 'border-t-[#2563EB] hover:border-[#2563EB]/70 hover:shadow-[#2563EB]/20',
    iconClass: 'bg-[#2563EB]/20 text-[#60A5FA]',
    cta: 'Sign in as Admin →',
  },
  {
    title: 'Teacher Login',
    subtitle: 'Faculty portal',
    description: 'Mark attendance, manage marks and view class analytics.',
    href: '/teacher/login',
    icon: BookOpen,
    accent: '#7C3AED',
    buttonClass: 'bg-[#7C3AED] hover:bg-[#6D28D9]',
    borderClass: 'border-t-[#7C3AED] hover:border-[#7C3AED]/70 hover:shadow-[#7C3AED]/20',
    iconClass: 'bg-[#7C3AED]/20 text-[#A78BFA]',
    cta: 'Sign in as Teacher →',
  },
  {
    title: 'Student Login',
    subtitle: 'Student portal',
    description: 'View attendance, marks, CGPA and register your face.',
    href: '/student/login',
    icon: UserCircle,
    accent: '#10B981',
    buttonClass: 'bg-[#10B981] hover:bg-[#059669]',
    borderClass: 'border-t-[#10B981] hover:border-[#10B981]/70 hover:shadow-[#10B981]/20',
    iconClass: 'bg-[#10B981]/20 text-[#34D399]',
    cta: 'Sign in as Student →',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0F172A] relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#2563EB] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#7C3AED] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
      </div>

      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-white/5 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
          <Link href="/" className="flex items-center gap-2">
            <GraduationCap className="w-8 h-8 text-[#2563EB]" />
            <span className="text-white font-bold text-xl">FaceAttend</span>
          </Link>
        </div>
      </nav>

      <main className="relative z-10 pt-28 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#2563EB]/50 bg-[#2563EB]/10 mb-6">
            <span className="text-[#2563EB]">*</span>
            <span className="text-white text-sm">Smart College Attendance System</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Smart Attendance & Academic Management
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Sign in to the right portal to manage attendance, academics, and account workflows.
          </p>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {roleCards.map((role) => {
            const Icon = role.icon;
            return (
              <div
                key={role.title}
                className={`group rounded-xl border border-white/10 border-t-4 bg-slate-800/50 p-6 backdrop-blur-sm transition-all duration-200 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-2xl ${role.borderClass}`}
              >
                <div className="flex flex-col h-full">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${role.iconClass}`}>
                    <Icon className="w-6 h-6" />
                  </div>

                  <div className="mt-5 flex-1">
                    <h2 className="text-xl font-bold text-white">{role.title}</h2>
                    <p className="text-sm text-gray-400 mt-1">{role.subtitle}</p>
                    <p className="text-sm text-gray-300 mt-4 leading-relaxed">{role.description}</p>
                  </div>

                  <Button asChild className={`mt-6 w-full h-11 text-white ${role.buttonClass}`}>
                    <Link href={role.href}>{role.cta}</Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <footer className="relative z-10 border-t border-white/10 py-6 text-center text-gray-500 text-sm">
        FaceAttend - Attendance & Academic Management
      </footer>
    </div>
  );
}
