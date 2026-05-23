'use client';

import { useEffect, useState } from 'react';
import { TeacherHeader } from '@/components/teacher/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '@/lib/auth-context';
import { apiGetDefaulters, apiWeeklyAttendance } from '@/lib/api';

export default function TeacherAnalyticsPage() {
  const { user } = useAuth();
  const subjectCode = user?.subject_code ?? user?.assignedSubject?.code ?? '';
  const [weekly, setWeekly] = useState<{ day: string; present: number; absent: number }[]>([]);
  const [defaulterCount, setDefaulterCount] = useState(0);

  useEffect(() => {
    if (!subjectCode) return;
    apiWeeklyAttendance(subjectCode)
      .then(setWeekly)
      .catch(() => setWeekly([]));
    apiGetDefaulters(subjectCode)
      .then((d) => setDefaulterCount(d.length))
      .catch(() => setDefaulterCount(0));
  }, [subjectCode]);

  return (
    <div className="min-h-screen">
      <TeacherHeader title="Analytics" />
      <main className="p-4 sm:p-6 space-y-6">
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle>{subjectCode || '—'} — Weekly attendance</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {weekly.length === 0 ? (
              <p className="text-[#64748B] text-sm">No attendance data yet to chart.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weekly}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="present" fill="#10B981" name="Present" />
                  <Bar dataKey="absent" fill="#EF4444" name="Absent" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card className="card-shadow">
          <CardContent className="p-6">
            <p className="text-3xl font-bold text-[#F59E0B]">{defaulterCount}</p>
            <p className="text-[#64748B]">students below 75% in {subjectCode}</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
