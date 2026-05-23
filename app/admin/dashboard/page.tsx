'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Activity, ChevronRight, GraduationCap, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { apiAdminDashboard, apiAdminSemesterSummary, AdminSemesterSummary } from '@/lib/api';
import { semesterLabel, semesterRoman } from '@/lib/admin-semesters';
import { useMinimumLoading } from '@/hooks/use-minimum-loading';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    teachers: 0,
    students: 0,
    recentActivity: [] as { id: string; type: string; message: string; timestamp: string }[],
  });
  const [semesters, setSemesters] = useState<AdminSemesterSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const showSkeleton = useMinimumLoading(loading);

  useEffect(() => {
    Promise.all([apiAdminDashboard(), apiAdminSemesterSummary()])
      .then(([dashboard, summary]) => {
        setStats(dashboard);
        setSemesters(summary);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const semesterMap = new Map(semesters.map((item) => [item.semester, item]));

  return (
    <main className="p-4 sm:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1E293B]">Semesters</h1>
        <p className="text-[#64748B]">Choose a semester to manage sections, students, and teachers.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="card-shadow">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-[#2563EB]/10 flex items-center justify-center">
              <Users className="w-7 h-7 text-[#2563EB]" />
            </div>
            <div>
              <p className="text-sm text-[#64748B]">Total Teachers</p>
              {showSkeleton ? <Skeleton className="mt-2 h-9 w-16" /> : <p className="text-3xl font-bold text-[#1E293B]">{stats.teachers}</p>}
            </div>
          </CardContent>
        </Card>
        <Card className="card-shadow">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-[#7C3AED]/10 flex items-center justify-center">
              <GraduationCap className="w-7 h-7 text-[#7C3AED]" />
            </div>
            <div>
              <p className="text-sm text-[#64748B]">Total Students</p>
              {showSkeleton ? <Skeleton className="mt-2 h-9 w-16" /> : <p className="text-3xl font-bold text-[#1E293B]">{stats.students}</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        {Array.from({ length: 8 }, (_, index) => index + 1).map((semester) => {
          const item = semesterMap.get(semester);
          return (
            <Link key={semester} href={`/admin/semester/${semester}`}>
              <Card className="card-shadow h-full border-[#E2E8F0] hover:border-[#2563EB] hover:shadow-lg transition-all">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-5xl font-bold text-[#0F172A]">{semesterRoman[semester]}</p>
                      <p className="mt-2 text-sm font-semibold text-[#1E293B]">{semesterLabel(semester)}</p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-[#0F172A] text-white flex items-center justify-center">
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-lg bg-[#F8FAFC] p-3">
                      <p className="text-[#64748B]">Sections</p>
                      {showSkeleton ? <Skeleton className="mt-2 h-7 w-10" /> : <p className="text-xl font-bold text-[#1E293B]">{item?.sections ?? 0}</p>}
                    </div>
                    <div className="rounded-lg bg-[#F8FAFC] p-3">
                      <p className="text-[#64748B]">Students</p>
                      {showSkeleton ? <Skeleton className="mt-2 h-7 w-10" /> : <p className="text-xl font-bold text-[#1E293B]">{item?.students ?? 0}</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="w-5 h-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {showSkeleton ? (
            <div className="space-y-3">
              <Skeleton className="h-12 rounded-lg" />
              <Skeleton className="h-12 rounded-lg" />
              <Skeleton className="h-12 rounded-lg" />
            </div>
          ) : stats.recentActivity.length === 0 ? (
            <p className="text-[#64748B] text-sm">No activity yet. Add teachers and students to get started.</p>
          ) : (
            <ul className="space-y-3">
              {stats.recentActivity.map((item) => (
                <li
                  key={item.id}
                  className="flex justify-between gap-4 p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-sm"
                >
                  <span className="text-[#1E293B]">{item.message || item.type}</span>
                  <span className="text-[#64748B] shrink-0">{item.timestamp}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
