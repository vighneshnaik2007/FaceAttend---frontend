'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { TeacherHeader } from '@/components/teacher/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ATTENDANCE_SHORTAGE_LABEL, isAttendanceShortage } from '@/lib/data';
import { cn } from '@/lib/utils';
import { apiGetStudent, apiGetStudentMarks, apiStudentAttendance } from '@/lib/api';

export default function StudentDetailPage() {
  const params = useParams();
  const usn = String(params.id || '').toUpperCase();
  const [student, setStudent] = useState<{ name: string; usn: string; email?: string; branch?: string } | null>(null);
  const [attendance, setAttendance] = useState<{ subjectCode: string; subjectName: string; percentage: number }[]>([]);
  const [marks, setMarks] = useState<{ subjectCode: string; total: number; maxTotal: number }[]>([]);

  useEffect(() => {
    if (!usn) return;
    apiGetStudent(usn)
      .then(setStudent)
      .catch(() => setStudent(null));
    apiStudentAttendance(usn)
      .then((rows) =>
        setAttendance(
          rows.map((r: { subjectCode: string; subjectName: string; percentage: number }) => ({
            subjectCode: r.subjectCode,
            subjectName: r.subjectName,
            percentage: r.percentage ?? 0,
          })),
        ),
      )
      .catch(() => setAttendance([]));
    apiGetStudentMarks(usn)
      .then((res) =>
        setMarks(
          (res.subjects ?? []).map((m) => ({
            subjectCode: m.subjectCode,
            total: m.totalMarks ?? m.totalInternal,
            maxTotal: m.totalMarks != null ? 100 : 50,
          })),
        ),
      )
      .catch(() => setMarks([]));
  }, [usn]);

  return (
    <div className="min-h-screen">
      <TeacherHeader title={student?.name ?? usn} />
      <main className="p-4 sm:p-6 space-y-6 max-w-3xl">
        {!student ? (
          <p className="text-[#64748B]">Student not found.</p>
        ) : (
          <Card className="card-shadow">
            <CardHeader>
              <CardTitle>{student.name}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-[#64748B] space-y-1">
              <p>USN: {student.usn}</p>
              {student.email && <p>Email: {student.email}</p>}
              {student.branch && <p>Branch: {student.branch}</p>}
            </CardContent>
          </Card>
        )}

        <Card className="card-shadow">
          <CardHeader>
            <CardTitle>Attendance by subject</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {attendance.length === 0 ? (
              <p className="text-sm text-[#64748B]">No attendance records.</p>
            ) : (
              attendance.map((a) => {
                const shortage = isAttendanceShortage(a.percentage);
                return (
                  <div key={a.subjectCode}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>
                        {a.subjectCode} — {a.subjectName}
                      </span>
                      <span className={cn(shortage && 'text-red-600 font-semibold')}>
                        {a.percentage}%
                        {shortage && ` (${ATTENDANCE_SHORTAGE_LABEL})`}
                      </span>
                    </div>
                    <Progress value={a.percentage} className={cn('h-2', shortage && '[&>div]:bg-red-500')} />
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card className="card-shadow">
          <CardHeader>
            <CardTitle>Marks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {marks.length === 0 ? (
              <p className="text-sm text-[#64748B]">No marks entered yet.</p>
            ) : (
              marks.map((m) => (
                <div key={m.subjectCode} className="flex justify-between text-sm">
                  <span>{m.subjectCode}</span>
                  <Badge variant="outline">
                    {m.total}/{m.maxTotal}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
