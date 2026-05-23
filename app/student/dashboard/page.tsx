'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { StudentHeader } from '@/components/student/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AlertTriangle,
  Camera,
  CalendarDays,
  CheckCircle2,
  Mail,
  RefreshCw,
  Target,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { ATTENDANCE_SHORTAGE_LABEL, isAttendanceShortage } from '@/lib/data';
import { cn } from '@/lib/utils';
import { useMinimumLoading } from '@/hooks/use-minimum-loading';
import { CondonationModal } from '@/components/student/condonation-modal';
import { TodayScheduleWidget } from '@/components/timetable/today-schedule';
import {
  apiStudentAttendance,
  apiGetStudent,
  apiFaceStatus,
  apiGetStudentMarks,
  apiStudentAnalytics,
  apiStudentShortageNotifications,
  apiGetStudentCondonationRequests,
  apiStudentTimetable,
  type StudentAnalytics,
  type StudentMarkSubject,
  type ShortageAlertLogRow,
  type CondonationRequest,
  type TimetableDays,
  type TimetableEntry,
} from '@/lib/api';

type AttendanceRow = {
  subjectCode: string;
  subjectName: string;
  percentage: number;
  present: number;
  totalClasses: number;
};

function getAttendancePrediction(row: AttendanceRow) {
  const attended = row.present;
  const total = row.totalClasses;
  if (total <= 0) return null;

  if (row.percentage < 75) {
    return {
      tone: 'orange' as const,
      value: Math.max(0, Math.ceil(((0.75 * total) - attended) / 0.25)),
      message: (value: number) =>
        `You need to attend the next ${value} consecutive classes without absence to reach 75% in ${row.subjectName}`,
    };
  }

  const classesCanMiss = Math.max(0, Math.floor((attended - (0.75 * total)) / 0.75));
  if (row.percentage <= 80) {
    return {
      tone: 'yellow' as const,
      value: classesCanMiss,
      message: (value: number) =>
        `You can only miss ${value} more classes in ${row.subjectName} before falling below 75%`,
    };
  }

  return {
    tone: 'green' as const,
    value: classesCanMiss,
    message: (value: number) =>
      `You can miss up to ${value} more classes in ${row.subjectName} and still maintain 75%`,
  };
}

function AttendancePredictionBox({ row }: { row: AttendanceRow }) {
  const prediction = getAttendancePrediction(row);
  if (!prediction) return null;

  return (
    <div
      className={cn(
        'mt-3 rounded-lg border px-4 py-3 text-sm font-medium',
        prediction.tone === 'orange' && 'border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-900 dark:bg-orange-950/40 dark:text-orange-200',
        prediction.tone === 'yellow' && 'border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-900 dark:bg-yellow-950/40 dark:text-yellow-200',
        prediction.tone === 'green' && 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200',
      )}
    >
      {prediction.message(prediction.value)}
    </div>
  );
}

function formatRegisteredAt(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const day = new Intl.DateTimeFormat('en-GB', { day: '2-digit' }).format(date);
  const month = new Intl.DateTimeFormat('en-GB', { month: 'short' }).format(date);
  const year = new Intl.DateTimeFormat('en-GB', { year: 'numeric' }).format(date);
  const time = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);

  return `${day} ${month} ${year} at ${time}`;
}

function EmptyState() {
  return (
    <Card className="card-shadow border-dashed">
      <CardContent className="p-10 text-center text-[#64748B]">
        <p className="text-lg font-medium text-[#1E293B]">
          No records yet. Your teacher will update your attendance and marks.
        </p>
      </CardContent>
    </Card>
  );
}

const TREND_COLORS = ['#2563EB', '#10B981', '#F59E0B', '#7C3AED', '#EF4444', '#0F766E'];
const TIMETABLE_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIMETABLE_SLOTS = [
  '8:00-9:00 AM',
  '9:00-10:00 AM',
  '10:00-11:00 AM',
  '11:00-12:00 PM',
  '12:00-1:00 PM',
  '2:00-3:00 PM',
  '3:00-4:00 PM',
  '4:00-5:00 PM',
];

function sectionDocumentId(section?: string, semester?: string | number) {
  const cleanSection = (section ?? '').toUpperCase();
  return semester && cleanSection ? `SEM${semester}_${cleanSection}` : cleanSection;
}

function SkeletonTable({ rows = 5, cells = 5 }: { rows?: number; cells?: number }) {
  return (
    <div className="min-w-[560px] space-y-3">
      {Array.from({ length: rows }).map((_, row) => (
        <div key={row} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cells}, minmax(90px, 1fr))` }}>
          {Array.from({ length: cells }).map((__, cell) => (
            <Skeleton key={cell} className="h-9 w-full" />
          ))}
        </div>
      ))}
    </div>
  );
}

function ChartSkeletons() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-2">
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-32 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

function StudentDashboardContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab') || 'attendance';
  const usn = user?.usn ?? '';

  const setTab = (value: string) => router.replace(`/student/dashboard?tab=${value}`);

  useEffect(() => {
    if (tab === 'face') {
      router.replace('/student/dashboard?tab=attendance');
    }
  }, [tab, router]);

  const [attendance, setAttendance] = useState<AttendanceRow[]>([]);
  const [marks, setMarks] = useState<StudentMarkSubject[]>([]);
  const [cgpa, setCgpa] = useState<number | null>(null);
  const [notifications, setNotifications] = useState<ShortageAlertLogRow[]>([]);
  const [analytics, setAnalytics] = useState<StudentAnalytics | null>(null);
  const [condonationRequests, setCondonationRequests] = useState<CondonationRequest[]>([]);
  const [profileSection, setProfileSection] = useState(sectionDocumentId(user?.section, user?.semester));
  const [todayTimetable, setTodayTimetable] = useState<TimetableEntry[]>([]);
  const [weeklyTimetable, setWeeklyTimetable] = useState<TimetableDays>({});
  const [faceRegistered, setFaceRegistered] = useState<boolean | null>(null);
  const [faceRegisteredAt, setFaceRegisteredAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const showSkeleton = useMinimumLoading(loading);
  const studentSection = profileSection.toUpperCase();

  const loadFaceStatus = useCallback(() => {
    if (!usn) return Promise.resolve();
    return apiFaceStatus(usn)
      .then((res) => {
        const registered = Boolean(res.registered ?? res.faceRegistered ?? res.face_registered);
        setFaceRegistered(registered);
        setFaceRegisteredAt(registered ? res.registered_at ?? null : null);
      })
      .catch(() => {
        setFaceRegistered(false);
        setFaceRegisteredAt(null);
      });
  }, [usn]);

  const loadStudentProfile = useCallback(() => {
    if (!usn) return Promise.resolve();
    return apiGetStudent(usn)
      .then((profile: { section?: string; semester?: string | number }) => setProfileSection(sectionDocumentId(profile.section, profile.semester ?? user?.semester)))
      .catch(() => setProfileSection(sectionDocumentId(user?.section, user?.semester)));
  }, [usn, user?.section, user?.semester]);

  const loadTimetable = useCallback(() => {
    if (!studentSection) {
      setTodayTimetable([]);
      setWeeklyTimetable({});
      return Promise.resolve();
    }
    return apiStudentTimetable(studentSection)
      .then((res) => {
        setTodayTimetable(res.classes ?? []);
        setWeeklyTimetable(res.days ?? {});
      })
      .catch(() => {
        setTodayTimetable([]);
        setWeeklyTimetable({});
      });
  }, [studentSection]);

  const loadData = useCallback(() => {
    if (!usn) return Promise.resolve();
    setLoading(true);
    return Promise.all([
      apiStudentAttendance(usn)
        .then((rows: AttendanceRow[]) =>
          setAttendance(
            rows.map((r) => ({
              subjectCode: r.subjectCode,
              subjectName: r.subjectName,
              percentage: r.percentage ?? 0,
              present: r.present ?? 0,
              totalClasses: r.totalClasses ?? 0,
            })),
          ),
        )
        .catch(() => setAttendance([])),
      apiGetStudentMarks(usn)
        .then((res) => {
          setMarks(res.subjects ?? []);
          setCgpa(res.cgpa ?? null);
        })
        .catch(() => {
          setMarks([]);
          setCgpa(null);
        }),
      apiStudentShortageNotifications(usn)
        .then((res) => setNotifications(res.notifications ?? []))
        .catch(() => setNotifications([])),
      apiStudentAnalytics(usn)
        .then(setAnalytics)
        .catch(() => setAnalytics(null)),
      apiGetStudentCondonationRequests(usn)
        .then((res) => setCondonationRequests(res.requests ?? []))
        .catch(() => setCondonationRequests([])),
      loadStudentProfile(),
      loadTimetable(),
      loadFaceStatus(),
    ]).finally(() => setLoading(false));
  }, [usn, loadFaceStatus, loadStudentProfile, loadTimetable]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const interval = window.setInterval(loadTimetable, 5 * 60 * 1000);
    return () => window.clearInterval(interval);
  }, [loadTimetable]);

  useEffect(() => {
    if (!usn) return;

    const applyLocalFaceStatus = () => {
      try {
        const raw = localStorage.getItem('faceRegistrationStatus');
        if (!raw) return;
        const parsed = JSON.parse(raw) as {
          usn?: string;
          registered?: boolean;
          registered_at?: string | null;
        };
        if (parsed.usn?.toUpperCase() === usn.toUpperCase() && parsed.registered) {
          setFaceRegistered(true);
          setFaceRegisteredAt(parsed.registered_at ?? null);
        }
      } catch {
        // Ignore malformed localStorage and let the API refresh correct it.
      }
    };

    applyLocalFaceStatus();
    const interval = window.setInterval(loadFaceStatus, 10000);
    window.addEventListener('storage', applyLocalFaceStatus);
    window.addEventListener('face-registration-updated', applyLocalFaceStatus);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('storage', applyLocalFaceStatus);
      window.removeEventListener('face-registration-updated', applyLocalFaceStatus);
    };
  }, [usn, loadFaceStatus]);

  const hasNoRecords = !showSkeleton && attendance.length === 0 && marks.length === 0;
  const trendSubjects = Array.from(new Set(analytics?.weekly.map((row) => row.subjectCode) ?? []));
  const trendData = Array.from(new Set(analytics?.weekly.map((row) => row.week) ?? [])).map((week) => {
    const row: Record<string, string | number> = { week };
    analytics?.weekly
      .filter((item) => item.week === week)
      .forEach((item) => {
        row[item.subjectCode] = item.percentage;
      });
    return row;
  });
  const hasTimetable = Object.values(weeklyTimetable).some((items) => items.length > 0);

  if (!user?.usn) return null;

  return (
    <div className="min-h-screen">
      <StudentHeader />

      <main className="p-4 sm:p-6 space-y-6">
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
            <RefreshCw className={cn('w-4 h-4 mr-2', loading && 'animate-spin')} />
            Refresh
          </Button>
        </div>

        <Card className={cn('card-shadow', faceRegistered ? 'border-emerald-200 bg-emerald-50' : '')}>
          <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'h-10 w-10 rounded-lg flex items-center justify-center',
                  faceRegistered ? 'bg-emerald-100' : 'bg-[#EEF2FF]',
                )}
              >
                {showSkeleton ? (
                  <Skeleton className="h-5 w-5 rounded-full" />
                ) : faceRegistered ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                ) : (
                  <Camera className="w-5 h-5 text-[#7C3AED]" />
                )}
              </div>
              <div>
                <p className="text-sm text-[#64748B]">Face registration status</p>
                <p className={cn('font-semibold', faceRegistered ? 'text-emerald-800' : 'text-[#1E293B]')}>
                  {faceRegistered ? 'Face Registration Complete ✅' : 'Register Face ⚠️'}
                </p>
                {faceRegistered && faceRegisteredAt && (
                  <p className="text-sm text-emerald-700">
                    Registered on {formatRegisteredAt(faceRegisteredAt)}
                  </p>
                )}
              </div>
            </div>
            {!faceRegistered && (
              <Button asChild>
                <Link href="/student/register-face">Register Face</Link>
              </Button>
            )}
          </CardContent>
        </Card>

        <TodayScheduleWidget title="Today's Schedule" entries={todayTimetable} loading={showSkeleton} mode="student" />

        {hasNoRecords && tab !== 'notifications' && <EmptyState />}

        <Tabs value={tab} onValueChange={setTab} className="space-y-6">
          <TabsList className="flex h-auto max-w-full flex-wrap gap-1 overflow-x-auto bg-white p-1 rounded-xl border shadow-sm">
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="timetable">Timetable</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="marks">Marks</TabsTrigger>
            <TabsTrigger value="cgpa">CGPA</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          <TabsContent value="attendance">
            <Card className="card-shadow">
              <CardHeader>
                <CardTitle>My Attendance</CardTitle>
                <p className="text-sm text-[#64748B]">Your data only — per subject percentage.</p>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                {showSkeleton ? (
                  <SkeletonTable rows={5} cells={6} />
                ) : attendance.length === 0 ? (
                  <EmptyState />
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-[#64748B]">
                        <th className="py-2 pr-4">Subject</th>
                        <th className="py-2 pr-4">Code</th>
                        <th className="py-2 pr-4">Present</th>
                        <th className="py-2 pr-4">Total</th>
                        <th className="py-2 pr-4">%</th>
                        <th className="py-2 pr-4">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendance.map((row) => {
                        const shortage = isAttendanceShortage(row.percentage);
                        const condonationReq = condonationRequests.find(
                          (r) => r.subject_code?.toUpperCase() === row.subjectCode.toUpperCase()
                        );

                        return (
                          <tr key={row.subjectCode} className="border-b">
                            <td colSpan={6}>
                              <div
                                className={cn(
                                  'grid grid-cols-6 gap-4 py-3 items-center',
                                  shortage ? 'bg-red-100 px-4' : 'bg-emerald-50/50 px-4',
                                )}
                              >
                                <td className="font-medium">{row.subjectName}</td>
                                <td className="font-mono text-xs">{row.subjectCode}</td>
                                <td>{row.present}</td>
                                <td>{row.totalClasses}</td>
                                <td
                                  className={cn(
                                    'font-bold',
                                    shortage ? 'text-red-700' : 'text-emerald-700',
                                  )}
                                >
                                  {row.percentage}%
                                </td>
                                <td className="flex flex-col gap-2">
                                  {shortage ? (
                                    <>
                                      <span className="text-red-700 text-xs font-semibold flex items-center gap-1">
                                        <AlertTriangle className="w-3.5 h-3.5" />
                                        {ATTENDANCE_SHORTAGE_LABEL}
                                      </span>
                                      <div className="flex gap-2 flex-wrap">
                                        {condonationReq ? (
                                          <>
                                            {condonationReq.status === 'pending' && (
                                              <Badge className="bg-amber-100 text-amber-800 text-xs dark:bg-amber-950 dark:text-amber-200">
                                                Condonation Request Pending
                                              </Badge>
                                            )}
                                            {condonationReq.status === 'approved' && (
                                              <Badge className="bg-emerald-100 text-emerald-800 text-xs dark:bg-emerald-950 dark:text-emerald-200">
                                                Condonation Approved
                                              </Badge>
                                            )}
                                            {condonationReq.status === 'rejected' && (
                                              <div className="space-y-1">
                                                <Badge className="bg-red-100 text-red-800 text-xs dark:bg-red-950 dark:text-red-200">
                                                  Condonation Rejected
                                                </Badge>
                                                {condonationReq.teacher_remarks && (
                                                  <p className="text-xs text-red-700 dark:text-red-300">
                                                    {condonationReq.teacher_remarks}
                                                  </p>
                                                )}
                                              </div>
                                            )}
                                          </>
                                        ) : (
                                          <CondonationModal
                                            usn={usn}
                                            subjectCode={row.subjectCode}
                                            subjectName={row.subjectName}
                                            onSubmitted={loadData}
                                          />
                                        )}
                                      </div>
                                    </>
                                  ) : (
                                    <span className="text-emerald-700 text-xs font-medium">✓ Above 75%</span>
                                  )}
                                </td>
                              </div>
                              <AttendancePredictionBox row={row} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timetable" className="space-y-6">
            {showSkeleton ? (
              <ChartSkeletons />
            ) : !studentSection ? (
              <Card className="card-shadow border-dashed">
                <CardContent className="p-10 text-center text-[#64748B]">
                  Section not assigned. Please contact administrator.
                </CardContent>
              </Card>
            ) : !hasTimetable ? (
              <Card className="card-shadow border-dashed">
                <CardContent className="p-10 text-center text-[#64748B]">
                  Timetable not yet added. Please check with your administrator.
                </CardContent>
              </Card>
            ) : (
              <>
                <Card className="card-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CalendarDays className="h-5 w-5 text-[#7C3AED]" />
                      Today's Schedule - {studentSection}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {todayTimetable.length === 0 ? (
                      <p className="text-[#64748B]">No classes scheduled today.</p>
                    ) : (
                      <div className="grid gap-3 md:grid-cols-2">
                        {todayTimetable.map((entry) => (
                          <div key={entry.id} className="rounded-xl border border-[#E9D5FF] bg-[#FAF5FF] p-4">
                            <p className="font-semibold text-[#1E1B4B]">{entry.time_slot}</p>
                            <p className="mt-1 text-sm font-medium text-[#312E81]">{entry.subject_name}</p>
                            <p className="text-sm text-[#64748B]">{entry.teacher_name} - Room {entry.room}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="card-shadow">
                  <CardHeader>
                    <CardTitle>Full Weekly Timetable</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[920px] border-separate border-spacing-0 text-sm">
                        <thead>
                          <tr>
                            <th className="sticky left-0 z-10 w-32 border-b bg-white p-3 text-left text-[#64748B]">Time</th>
                            {TIMETABLE_DAYS.map((day) => (
                              <th key={day} className="border-b p-3 text-left text-[#64748B]">{day}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {TIMETABLE_SLOTS.map((slot) => (
                            <tr key={slot}>
                              <td className="sticky left-0 z-10 border-b bg-white p-3 font-semibold text-[#1E293B]">{slot}</td>
                              {TIMETABLE_DAYS.map((day) => {
                                const entry = (weeklyTimetable[day] ?? []).find((item) => item.time_slot === slot);
                                return (
                                  <td key={`${day}-${slot}`} className="h-28 min-w-32 border-b border-l p-3 align-top">
                                    {entry ? (
                                      <div className="rounded-lg border border-[#DBEAFE] bg-[#EFF6FF] p-3">
                                        <p className="font-semibold text-[#1E3A8A]">{entry.subject_name}</p>
                                        <p className="mt-1 text-xs text-[#475569]">{entry.teacher_name}</p>
                                        <p className="mt-1 text-xs text-[#64748B]">Room {entry.room}</p>
                                      </div>
                                    ) : (
                                      <span className="text-xs text-[#94A3B8]">No class</span>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            {showSkeleton ? (
              <ChartSkeletons />
            ) : !analytics || analytics.subjects.length === 0 ? (
              <EmptyState />
            ) : (
              <>
                <div className="grid gap-6 xl:grid-cols-2">
                  <Card className="card-shadow">
                    <CardHeader>
                      <CardTitle>Attendance Across Subjects</CardTitle>
                    </CardHeader>
                    <CardContent className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analytics.subjects}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="subjectCode" />
                          <YAxis domain={[0, 100]} />
                          <Tooltip />
                          <Bar dataKey="percentage" name="Attendance %">
                            {analytics.subjects.map((subject) => (
                              <Cell
                                key={subject.subjectCode}
                                fill={subject.percentage < 75 ? '#EF4444' : '#10B981'}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card className="card-shadow">
                    <CardHeader>
                      <CardTitle>Attendance Trend</CardTitle>
                    </CardHeader>
                    <CardContent className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={trendData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="week" />
                          <YAxis domain={[0, 100]} />
                          <Tooltip />
                          <Legend />
                          {trendSubjects.map((subjectCode, index) => (
                            <Line
                              key={subjectCode}
                              type="monotone"
                              dataKey={subjectCode}
                              stroke={TREND_COLORS[index % TREND_COLORS.length]}
                              strokeWidth={2}
                            />
                          ))}
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {analytics.predictions.map((prediction) => (
                    <Card
                      key={prediction.subjectCode}
                      className={cn(
                        'card-shadow',
                        prediction.needed > 0 ? 'border-amber-200 bg-amber-50' : 'border-emerald-200 bg-emerald-50',
                      )}
                    >
                      <CardContent className="p-4">
                        <p className="font-semibold text-[#1E293B]">{prediction.subjectName}</p>
                        <p className="text-xs font-mono text-[#64748B]">{prediction.subjectCode}</p>
                        <p className={cn('mt-3 text-2xl font-bold', prediction.needed > 0 ? 'text-amber-700' : 'text-emerald-700')}>
                          {prediction.needed}
                        </p>
                        <p className="text-sm text-[#64748B]">
                          {prediction.needed > 0
                            ? 'more consecutive classes needed to reach 75%'
                            : 'classes needed. You are at or above 75%.'}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="marks">
            <Card className="card-shadow">
              <CardHeader>
                <CardTitle>My Marks</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                {showSkeleton ? (
                  <SkeletonTable rows={5} cells={8} />
                ) : marks.length === 0 ? (
                  <EmptyState />
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-[#64748B]">
                        <th className="py-2 pr-3">Subject</th>
                        <th className="py-2 pr-3">CIE1</th>
                        <th className="py-2 pr-3">CIE2</th>
                        <th className="py-2 pr-3">Assignment</th>
                        <th className="py-2 pr-3">Total Internal</th>
                        <th className="py-2 pr-3">SEE</th>
                        <th className="py-2 pr-3">Total Marks</th>
                        <th className="py-2 pr-3">Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {marks.map((m) => (
                        <tr key={m.subjectCode} className="border-b">
                          <td className="py-3">
                            <div className="font-medium">{m.subjectName}</div>
                            <div className="text-xs font-mono text-[#64748B]">{m.subjectCode}</div>
                          </td>
                          <td className="py-3">{m.cie1}/20</td>
                          <td className="py-3">{m.cie2}/20</td>
                          <td className="py-3">{m.assignment}/10</td>
                          <td className="py-3 font-semibold">{m.totalInternal}/50</td>
                          <td className="py-3">{m.see != null ? `${m.see}/50` : '—'}</td>
                          <td className="py-3 font-semibold">
                            {m.totalMarks != null ? `${m.totalMarks}/100` : `${m.totalInternal}/50*`}
                          </td>
                          <td className="py-3">
                            <Badge variant="outline">{m.grade}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                {marks.length > 0 && (
                  <p className="text-xs text-[#64748B] mt-3">* Grade from internal marks until SEE is entered.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cgpa">
            <Card className="card-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-[#7C3AED]" />
                  CGPA
                </CardTitle>
              </CardHeader>
              <CardContent>
                {showSkeleton ? (
                  <div className="space-y-4 py-8">
                    <Skeleton className="mx-auto h-16 w-28" />
                    <Skeleton className="mx-auto h-4 w-64 max-w-full" />
                    <Skeleton className="mx-auto h-32 w-full max-w-md" />
                  </div>
                ) : cgpa == null || marks.length === 0 ? (
                  <EmptyState />
                ) : (
                  <div className="text-center py-8">
                    <p className="text-6xl font-bold text-[#7C3AED]">{cgpa.toFixed(2)}</p>
                    <p className="text-[#64748B] mt-2">
                      Calculated from {marks.length} subject(s) with marks entered
                    </p>
                    <div className="mt-6 max-w-md mx-auto text-left space-y-2">
                      {marks.map((m) => (
                        <div key={m.subjectCode} className="flex justify-between text-sm border-b py-2">
                          <span>{m.subjectCode}</span>
                          <span>
                            {m.grade} ({m.gradePoint} pts)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card className="card-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Shortage Alert Emails
                </CardTitle>
                <p className="text-sm text-[#64748B]">Emails sent when your attendance dropped below 75%.</p>
              </CardHeader>
              <CardContent className="space-y-3">
                {showSkeleton ? (
                  <div className="space-y-3">
                    <Skeleton className="h-24 rounded-xl" />
                    <Skeleton className="h-24 rounded-xl" />
                  </div>
                ) : notifications.length === 0 ? (
                  <p className="text-[#64748B]">No shortage alert emails received yet.</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={`${n.alert_group_id}-${n.timestamp}`}
                      className={cn(
                        'p-4 rounded-xl border',
                        n.email_status === 'sent' ? 'bg-amber-50 border-amber-200' : 'bg-gray-50',
                      )}
                    >
                      <div className="flex justify-between gap-2 flex-wrap">
                        <p className="font-medium">
                          {n.subject_code} — {n.subject_name}
                        </p>
                        <Badge variant="outline" className="text-red-600">
                          {n.attendance_pct}%
                        </Badge>
                      </div>
                      <p className="text-sm text-[#64748B] mt-1 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        {ATTENDANCE_SHORTAGE_LABEL}
                      </p>
                      <p className="text-xs text-[#64748B] mt-1">
                        Email: {n.email_status ?? '—'} · {n.timestamp}
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

export default function StudentDashboardPage() {
  return (
    <Suspense fallback={<div className="p-8"><Skeleton className="h-32 rounded-xl" /></div>}>
      <StudentDashboardContent />
    </Suspense>
  );
}
