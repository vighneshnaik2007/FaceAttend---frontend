'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { TeacherHeader } from '@/components/teacher/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Camera,
  Save,
  Loader2,
  AlertTriangle,
  Mail,
  Send,
  RefreshCw,
  BarChart3,
  Download,
  FileText,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { WebcamCapture } from '@/components/webcam-capture';
import { TodayScheduleWidget } from '@/components/timetable/today-schedule';
import { isAttendanceShortage, ATTENDANCE_SHORTAGE_LABEL } from '@/lib/data';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useMinimumLoading } from '@/hooks/use-minimum-loading';
import {
  apiGetStudents,
  apiGetMarks,
  apiSaveMarks,
  apiMarkBulkAttendance,
  apiRecognizeFace,
  apiTodayAttendance,
  apiGetTodayDate,
  apiGetAttendanceDates,
  apiAttendanceByDate,
  apiGetDefaulters,
  apiShortageAlertsLog,
  apiExportUrl,
  apiTeacherAnalytics,
  apiTodaySchedule,
  apiGetTeacherCondonationRequests,
  apiRespondToCondonation,
  type TeacherAnalytics,
  type TimetableEntry,
  type ShortageAlertLogRow,
  type CondonationRequest,
} from '@/lib/api';

type StudentRow = { id?: string; usn: string; name: string; face_registered?: boolean };

type AttendanceViewRow = {
  usn: string;
  name: string;
  status: string;
  attendance_pct?: number;
  timeMarked?: string;
};

type MarkRow = {
  usn: string;
  name: string;
  cie1: number | '';
  cie2: number | '';
  assignment: number | '';
  see: number | '';
};

type CameraMatch = {
  usn: string;
  name: string;
  confidence: number;
};

const PIE_COLORS = ['#10B981', '#EF4444'];

function SkeletonTable({ rows = 5, cells = 4 }: { rows?: number; cells?: number }) {
  return (
    <div className="min-w-[560px] space-y-3">
      {Array.from({ length: rows }).map((_, row) => (
        <div key={row} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cells}, minmax(100px, 1fr))` }}>
          {Array.from({ length: cells }).map((__, cell) => (
            <Skeleton key={cell} className="h-9 w-full" />
          ))}
        </div>
      ))}
    </div>
  );
}

function StudentListSkeleton() {
  return (
    <div className="border rounded-xl divide-y">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="flex items-center gap-4 px-4 py-3">
          <Skeleton className="h-5 w-5 rounded-sm" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-40 max-w-full" />
            <Skeleton className="h-3 w-28 max-w-full" />
          </div>
          <Skeleton className="h-6 w-20" />
        </div>
      ))}
    </div>
  );
}

function formatDateTime(value?: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

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

function documentNameFromUrl(url: string) {
  try {
    const parsed = new URL(url);
    const last = parsed.pathname.split('/').pop() || 'Document';
    return decodeURIComponent(last).replace(/^\d{14,}-/, '');
  } catch {
    return url.split('/').pop() || 'Document';
  }
}

function isImageDocument(url: string) {
  const clean = url.split('?')[0].toLowerCase();
  return clean.endsWith('.jpg') || clean.endsWith('.jpeg') || clean.endsWith('.png');
}

function RequestDocuments({ urls }: { urls?: string[] }) {
  if (!urls || urls.length === 0) {
    return <p className="text-xs text-[#64748B] dark:text-slate-400">No documents attached</p>;
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-[#1E293B] dark:text-slate-100">Documents</p>
      <div className="flex flex-wrap gap-2">
        {urls.map((url, index) => {
          const name = documentNameFromUrl(url);
          return (
            <a
              key={`${url}-${index}`}
              href={url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 max-w-[220px] items-center gap-2 rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-xs text-[#1E293B] hover:border-[#2563EB] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
            >
              {isImageDocument(url) ? (
                <img src={url} alt="" className="h-8 w-8 rounded object-cover" />
              ) : (
                <FileText className="h-5 w-5 shrink-0 text-red-600" />
              )}
              <span className="truncate">{name || `Document ${index + 1}`}</span>
            </a>
          );
        })}
      </div>
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="card-shadow">
            <CardContent className="p-4 space-y-3">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-8 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-80 rounded-xl xl:col-span-2" />
      </div>
    </div>
  );
}

function TeacherDashboardContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab') || 'take';

  const setTab = (value: string) => {
    router.replace(`/teacher/dashboard?tab=${value}`);
  };

  const subjectCode = (user?.subject_code ?? user?.assignedSubject?.code ?? '').toUpperCase();
  const subjectName = user?.assignedSubject?.name ?? '';

  const [students, setStudents] = useState<StudentRow[]>([]);
  const [attendanceDate, setAttendanceDate] = useState('');
  const [todaySubmitted, setTodaySubmitted] = useState(false);
  const [presentMap, setPresentMap] = useState<Record<string, boolean>>({});
  const [showCamera, setShowCamera] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [recognizing, setRecognizing] = useState(false);
  const [scanStatus, setScanStatus] = useState<string | null>(null);
  const [cameraMatches, setCameraMatches] = useState<CameraMatch[]>([]);
  const [recognizedUsns, setRecognizedUsns] = useState<Set<string>>(new Set());
  const [submittingAtt, setSubmittingAtt] = useState(false);

  const [viewRows, setViewRows] = useState<AttendanceViewRow[]>([]);
  const [pastDates, setPastDates] = useState<string[]>([]);
  const [selectedPastDate, setSelectedPastDate] = useState<string | null>(null);
  const [pastRecords, setPastRecords] = useState<AttendanceViewRow[]>([]);
  const [pastPresentMap, setPastPresentMap] = useState<Record<string, boolean>>({});
  const [editingPastAttendance, setEditingPastAttendance] = useState(false);
  const [pastLoading, setPastLoading] = useState(false);
  const [defaulters, setDefaulters] = useState<{ usn: string; name: string; attendance: number; present: number; total: number; classes_needed?: number }[]>([]);
  const [alerts, setAlerts] = useState<ShortageAlertLogRow[]>([]);

  const [markRows, setMarkRows] = useState<MarkRow[]>([]);
  const [savingMarks, setSavingMarks] = useState(false);
  const [teacherAnalytics, setTeacherAnalytics] = useState<TeacherAnalytics | null>(null);
  const [todayClasses, setTodayClasses] = useState<TimetableEntry[]>([]);
  const [condonationRequests, setCondonationRequests] = useState<CondonationRequest[]>([]);
  const [respondingRequestId, setRespondingRequestId] = useState<string | null>(null);
  const [respondingStatus, setRespondingStatus] = useState<'approved' | 'rejected'>('approved');
  const [respondingRemarks, setRespondingRemarks] = useState('');
  const [respondingLoading, setRespondingLoading] = useState(false);

  const [loading, setLoading] = useState(true);
  const showSkeleton = useMinimumLoading(loading);

  const loadStudents = useCallback(() => {
    return apiGetStudents()
      .then((list: StudentRow[]) => {
        setStudents(list);
        const init: Record<string, boolean> = {};
        list.forEach((s) => {
          init[s.usn] = false;
        });
        setPresentMap(init);
      })
      .catch(() => setStudents([]));
  }, []);

  const loadTodayDate = useCallback(() => {
    if (!subjectCode) return Promise.resolve();
    return apiGetTodayDate()
      .then((data) => setAttendanceDate(data.today))
      .catch(() => setAttendanceDate(new Date().toISOString().split('T')[0]));
  }, [subjectCode]);

  const loadViewAttendance = useCallback(() => {
    if (!subjectCode) return Promise.resolve();
    return apiTodayAttendance(subjectCode)
      .then((data: { records?: AttendanceViewRow[]; submitted?: boolean; date?: string }) => {
        setViewRows(data.records ?? []);
        setTodaySubmitted(Boolean(data.submitted));
        if (data.date) setAttendanceDate(data.date);
      })
      .catch(() => {
        setViewRows([]);
        setTodaySubmitted(false);
      });
  }, [subjectCode]);

  const loadPastDates = useCallback(() => {
    if (!subjectCode) return Promise.resolve();
    return apiGetAttendanceDates(subjectCode)
      .then((data) => setPastDates(data.dates ?? []))
      .catch(() => setPastDates([]));
  }, [subjectCode]);

  const loadDefaulters = useCallback(() => {
    if (!subjectCode) return Promise.resolve();
    return apiGetDefaulters(subjectCode)
      .then(setDefaulters)
      .catch(() => setDefaulters([]));
  }, [subjectCode]);

  const loadPastAttendance = useCallback(
    (date: string) => {
      if (!subjectCode) return Promise.resolve();
      setPastLoading(true);
      return apiAttendanceByDate(subjectCode, date)
        .then((rows) => {
          setSelectedPastDate(date);
          setPastRecords(rows);
          const map: Record<string, boolean> = {};
          rows.forEach((row) => {
            map[row.usn] = row.status === 'present';
          });
          setPastPresentMap(map);
          setEditingPastAttendance(true);
        })
        .catch(() => {
          setSelectedPastDate(null);
          setPastRecords([]);
          setPastPresentMap({});
          setEditingPastAttendance(false);
        })
        .finally(() => setPastLoading(false));
    },
    [subjectCode],
  );

  const loadAlerts = useCallback(() => {
    return apiShortageAlertsLog(100)
      .then((res) => {
        const all = res.alerts ?? [];
        setAlerts(
          subjectCode
            ? all.filter((a) => a.subject_code?.toUpperCase() === subjectCode)
            : all,
        );
      })
      .catch(() => setAlerts([]));
  }, [subjectCode]);

  const loadMarks = useCallback(() => {
    if (!subjectCode) return Promise.resolve();
    return apiGetMarks(subjectCode)
      .then(
        (data: {
          usn: string;
          name: string;
          cie1: number | null;
          cie2: number | null;
          assignment: number | null;
          see: number | null;
        }[]) => {
          setMarkRows(
            data.map((r) => ({
              usn: r.usn,
              name: r.name,
              cie1: r.cie1 ?? '',
              cie2: r.cie2 ?? '',
              assignment: r.assignment ?? '',
              see: r.see ?? '',
            })),
          );
        },
      )
      .catch(() => setMarkRows([]));
  }, [subjectCode]);

  const loadAnalytics = useCallback(() => {
    if (!subjectCode) return Promise.resolve();
    return apiTeacherAnalytics(subjectCode)
      .then(setTeacherAnalytics)
      .catch(() => setTeacherAnalytics(null));
  }, [subjectCode]);

  const loadTodaySchedule = useCallback(() => {
    const teacherId = user?.teacherId ?? user?.id ?? '';
    if (!teacherId) return Promise.resolve();
    return apiTodaySchedule(teacherId)
      .then((res) => setTodayClasses(res.classes ?? []))
      .catch(() => setTodayClasses([]));
  }, [user?.teacherId, user?.id]);

  const loadCondonationRequests = useCallback(() => {
    if (!subjectCode) return Promise.resolve();
    return apiGetTeacherCondonationRequests(subjectCode)
      .then((res) => setCondonationRequests(res.requests ?? []))
      .catch(() => setCondonationRequests([]));
  }, [subjectCode]);

  useEffect(() => {
    if (!user || !subjectCode) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([
      loadStudents(),
      loadTodayDate(),
      loadViewAttendance(),
      loadDefaulters(),
      loadAlerts(),
      loadMarks(),
      loadPastDates(),
      loadAnalytics(),
      loadTodaySchedule(),
      loadCondonationRequests(),
    ]).finally(() => setLoading(false));
  }, [user, subjectCode, loadStudents, loadTodayDate, loadViewAttendance, loadDefaulters, loadAlerts, loadMarks, loadPastDates, loadAnalytics, loadTodaySchedule, loadCondonationRequests]);

  useEffect(() => {
    if (tab === 'condonation') {
      loadCondonationRequests();
    }
  }, [tab, loadCondonationRequests]);

  useEffect(() => {
    const interval = window.setInterval(loadTodaySchedule, 5 * 60 * 1000);
    return () => window.clearInterval(interval);
  }, [loadTodaySchedule]);

  const togglePresent = (usn: string) => {
    setPresentMap((prev) => ({ ...prev, [usn]: !prev[usn] }));
  };

  const togglePastPresent = (usn: string) => {
    setPastPresentMap((prev) => ({ ...prev, [usn]: !prev[usn] }));
  };

  const startCameraAttendance = () => {
    setShowCamera(true);
    setIsScanning(true);
    setScanStatus('Scanning… point camera at students');
    setCameraMatches([]);
  };

  const stopCameraAttendance = () => {
    setShowCamera(false);
    setIsScanning(false);
    setScanStatus(null);
    setCameraMatches([]);
  };

  const handleFrame = useCallback(
    async (dataUrl: string) => {
      if (recognizing || !isScanning || !subjectCode) return;
      setRecognizing(true);
      try {
        const res = await apiRecognizeFace(dataUrl, subjectCode);
        if (res.matches?.length) {
          const highConfidence = res.matches.filter((match) => match.confidence > 75);
          setCameraMatches(res.matches);
          setPresentMap((prev) => {
            const next = { ...prev };
            for (const m of highConfidence) {
              next[m.usn] = true;
            }
            return next;
          });
          setRecognizedUsns((prev) => {
            const next = new Set(prev);
            for (const m of highConfidence) {
              next.add(m.usn);
            }
            return next;
          });
          setScanStatus(
            highConfidence.length > 0
              ? `${highConfidence.map((m) => `${m.name} ${m.confidence}% match`).join(' · ')}`
              : 'Low confidence — please verify manually',
          );
        } else if (res.faces_in_frame > 0) {
          setCameraMatches([]);
          setScanStatus(
            res.message || 'Face not recognized — please mark manually',
          );
        } else {
          setCameraMatches([]);
          setScanStatus(res.message || 'No face in frame — adjust camera');
        }
      } catch (e) {
        setCameraMatches([]);
        setScanStatus(e instanceof Error ? e.message : 'Recognition failed');
      } finally {
        setRecognizing(false);
      }
    },
    [isScanning, recognizing, subjectCode],
  );

  const submitAttendance = async () => {
    if (!subjectCode) {
      toast.error('No subject assigned to your account');
      return;
    }
    if (todaySubmitted) {
      toast.error('Attendance has already been taken for today');
      return;
    }
    setSubmittingAtt(true);
    try {
      await apiMarkBulkAttendance({
        subject_code: subjectCode,
        date: attendanceDate,
        marked_by: user?.name ?? 'Teacher',
        records: students.map((s) => ({
          usn: s.usn,
          status: presentMap[s.usn] ? 'present' : 'absent',
        })),
      });
      toast.success(`Attendance saved for ${subjectCode}. Shortage emails sent automatically if any student is below 75%.`);
      await Promise.all([loadViewAttendance(), loadDefaulters(), loadAlerts(), loadPastDates(), loadAnalytics()]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save attendance');
    } finally {
      setSubmittingAtt(false);
    }
  };

  const savePastAttendance = async () => {
    if (!subjectCode || !selectedPastDate) {
      toast.error('Select a past date to edit');
      return;
    }
    setSubmittingAtt(true);
    try {
      await apiMarkBulkAttendance({
        subject_code: subjectCode,
        date: selectedPastDate,
        marked_by: user?.name ?? 'Teacher',
        records: students.map((s) => ({
          usn: s.usn,
          status: pastPresentMap[s.usn] ? 'present' : 'absent',
        })),
      });
      toast.success(`Attendance updated for ${selectedPastDate}`);
      await Promise.all([loadViewAttendance(), loadDefaulters(), loadAlerts(), loadPastDates(), loadAnalytics()]);
      setEditingPastAttendance(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save past attendance');
    } finally {
      setSubmittingAtt(false);
    }
  };

  const updateMark = (usn: string, field: keyof MarkRow, val: string) => {
    setMarkRows((prev) =>
      prev.map((r) =>
        r.usn === usn ? { ...r, [field]: val === '' ? '' : Number(val) } : r,
      ),
    );
  };

  const saveMarks = async () => {
    if (!subjectCode) return;
    setSavingMarks(true);
    try {
      await apiSaveMarks({
        subject_code: subjectCode,
        records: markRows.map((r) => ({
          usn: r.usn,
          cie1: Number(r.cie1) || 0,
          cie2: Number(r.cie2) || 0,
          cie3: 0,
          assignment: Number(r.assignment) || 0,
          see: r.see === '' ? null : Number(r.see),
        })),
      });
      toast.success('Marks saved');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSavingMarks(false);
    }
  };

  const markRowsHaveErrors = markRows.some((r) => {
    return (
      (typeof r.cie1 === 'number' && (r.cie1 < 0 || r.cie1 > 30)) ||
      (typeof r.cie2 === 'number' && (r.cie2 < 0 || r.cie2 > 30)) ||
      (typeof r.assignment === 'number' && (r.assignment < 0 || r.assignment > 20)) ||
      (typeof r.see === 'number' && (r.see < 0 || r.see > 100))
    );
  });

  const refreshAll = () => {
    setLoading(true);
    Promise.all([loadStudents(), loadTodayDate(), loadViewAttendance(), loadDefaulters(), loadAlerts(), loadMarks(), loadPastDates(), loadAnalytics(), loadTodaySchedule(), loadCondonationRequests()]).finally(
      () => setLoading(false),
    );
  };

  const downloadExport = (path: string) => {
    window.open(apiExportUrl(path), '_blank');
  };

  const respondToCondonation = async (requestId: string, status: 'approved' | 'rejected', remarks: string) => {
    setRespondingLoading(true);
    try {
      await apiRespondToCondonation(requestId, status, remarks);
      setCondonationRequests((prev) =>
        prev.map((request) =>
          request.id === requestId
            ? { ...request, status, teacher_remarks: remarks }
            : request,
        ),
      );
      setRespondingRequestId(null);
      setRespondingStatus('approved');
      setRespondingRemarks('');
      toast.success(`Condonation request ${status}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to respond to condonation request');
    } finally {
      setRespondingLoading(false);
    }
  };

  const respondingRequest = condonationRequests.find((request) => request.id === respondingRequestId);

  if (!subjectCode) {
    return (
      <div className="min-h-screen">
        <TeacherHeader />
        <main className="p-4 sm:p-8">
          <Card className="card-shadow border-amber-200 bg-amber-50">
            <CardContent className="p-6">
              <p className="font-medium text-amber-900">No subject assigned</p>
              <p className="text-sm text-amber-800 mt-1">
                Ask the administrator to set subject_code on your teacher record.
              </p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <TeacherHeader title={`${subjectCode} — Teacher Portal`} />

      <main className="p-4 sm:p-6">
        <div className="flex flex-wrap justify-end gap-3 mb-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => downloadExport(`/api/export/attendance/pdf/${subjectCode}`)}>
                Download Attendance PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => downloadExport(`/api/export/attendance/excel/${subjectCode}`)}>
                Download Attendance Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => downloadExport(`/api/export/marks/pdf/${subjectCode}`)}>
                Download Marks PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => downloadExport(`/api/export/marks/excel/${subjectCode}`)}>
                Download Marks Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="sm" onClick={refreshAll} disabled={loading}>
            <RefreshCw className={cn('w-4 h-4 mr-2', loading && 'animate-spin')} />
            Refresh
          </Button>
        </div>

        <Tabs value={tab} onValueChange={setTab} className="space-y-6">
          <TabsList className="flex h-auto max-w-full flex-wrap gap-1 overflow-x-auto bg-white p-1 rounded-xl border shadow-sm">
            <TabsTrigger value="take">Take Attendance</TabsTrigger>
            <TabsTrigger value="view">View Attendance</TabsTrigger>
            <TabsTrigger value="marks">Marks Management</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="defaulters">Defaulters</TabsTrigger>
            <TabsTrigger value="condonation">Condonation Requests</TabsTrigger>
            <TabsTrigger value="notifications">Notifications Sent</TabsTrigger>
          </TabsList>

          {/* ── Take Attendance ── */}
          <TabsContent value="take" className="space-y-4">
            <TodayScheduleWidget title="Today's Schedule" entries={todayClasses} loading={showSkeleton} mode="teacher" />

            <Card className="card-shadow">
              <CardHeader>
                <CardTitle>Take Attendance — {subjectCode}</CardTitle>
                <p className="text-sm text-[#64748B]">
                  Mark today’s attendance manually or with the camera. The date is provided by the server.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-4 items-end">
                  <div>
                    <Label>Date</Label>
                    <div className="mt-1 text-sm text-slate-700 font-medium">
                      {showSkeleton ? <Skeleton className="h-5 w-28" /> : attendanceDate}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant={showCamera ? 'default' : 'outline'}
                    onClick={showCamera ? stopCameraAttendance : startCameraAttendance}
                    className={showCamera ? 'bg-[#10B981] hover:bg-[#059669]' : ''}
                    disabled={todaySubmitted}
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    {showCamera ? 'Stop Camera' : 'Use Webcam'}
                  </Button>
                  <Button
                    onClick={submitAttendance}
                    disabled={submittingAtt || students.length === 0 || todaySubmitted}
                    className="bg-[#2563EB]"
                  >
                    {submittingAtt ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                    Save Attendance
                  </Button>
                </div>

                {todaySubmitted ? (
                  <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900">
                    Attendance already taken for today. The recorded attendance below is read-only.
                  </div>
                ) : (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-slate-700">
                    <p className="text-sm">
                      Use the camera to speed up marking, or adjust attendance manually below. The date is locked to today.
                    </p>
                  </div>
                )}

                {showCamera && !todaySubmitted && (
                  <div className="rounded-xl border p-4 bg-[#0F172A]/5 space-y-2">
                    <WebcamCapture
                      active={isScanning}
                      onFrame={handleFrame}
                      frameIntervalMs={900}
                      className="mx-auto w-full max-w-lg rounded-lg overflow-hidden"
                    />
                    {scanStatus && (
                      <p
                        className={cn(
                          'text-sm mt-2 text-center font-medium',
                          scanStatus.includes('Low confidence')
                            ? 'text-yellow-800 bg-yellow-50 py-2 px-3 rounded-lg dark:bg-yellow-950/40 dark:text-yellow-200'
                            : scanStatus.includes('not recognized')
                            ? 'text-amber-700 bg-amber-50 py-2 px-3 rounded-lg'
                            : cameraMatches.some((match) => match.confidence > 75)
                              ? 'text-emerald-700 bg-emerald-50 py-2 px-3 rounded-lg'
                              : 'text-[#64748B]',
                        )}
                      >
                        {scanStatus}
                      </p>
                    )}
                    {cameraMatches.length > 0 && (
                      <div className="space-y-2">
                        {cameraMatches.map((match) => (
                          <div
                            key={match.usn}
                            className={cn(
                              'rounded-lg border px-3 py-2 text-sm font-medium',
                              match.confidence > 75
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200'
                                : 'border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-900 dark:bg-yellow-950/40 dark:text-yellow-200',
                            )}
                          >
                            {match.name} {match.confidence}% match
                            {match.confidence > 75
                              ? ' — auto-marked present'
                              : ' — Low confidence, please verify manually'}
                          </div>
                        ))}
                      </div>
                    )}
                    {recognizing && (
                      <p className="text-xs text-center text-[#64748B] flex items-center justify-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Processing frame…
                      </p>
                    )}
                  </div>
                )}

                {showSkeleton ? (
                  <StudentListSkeleton />
                ) : students.length === 0 ? (
                  <p className="text-[#64748B]">No students in the system. Add students via the admin panel.</p>
                ) : (
                  <div className="border rounded-xl divide-y max-h-[420px] overflow-y-auto">
                    {students.map((s) => (
                      <label
                        key={s.usn}
                        className={cn(
                          'flex items-center gap-4 px-4 py-3 transition-colors',
                          recognizedUsns.has(s.usn)
                            ? 'bg-green-100 ring-2 ring-inset ring-green-400'
                            : 'hover:bg-[#F8FAFC]',
                        )}
                      >
                        <Checkbox
                          checked={!!presentMap[s.usn]}
                          onCheckedChange={() => !todaySubmitted && togglePresent(s.usn)}
                          disabled={todaySubmitted}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-[#1E293B]">{s.name}</p>
                          <p className="text-xs text-[#64748B] font-mono">{s.usn}</p>
                        </div>
                        <Badge variant={presentMap[s.usn] ? 'default' : 'secondary'}>
                          {presentMap[s.usn] ? 'Present' : 'Absent'}
                        </Badge>
                      </label>
                    ))}
                  </div>
                )}

                {todaySubmitted && viewRows.length > 0 && (
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="font-semibold text-slate-900 mb-3">Today's recorded attendance</p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-left text-[#64748B]">
                            <th className="py-2 pr-4">USN</th>
                            <th className="py-2 pr-4">Name</th>
                            <th className="py-2 pr-4">Today</th>
                            <th className="py-2 pr-4">Marked</th>
                          </tr>
                        </thead>
                        <tbody>
                          {viewRows.map((r) => (
                            <tr key={r.usn} className="border-b last:border-b-0">
                              <td className="py-3 font-mono text-xs">{r.usn}</td>
                              <td className="py-3">{r.name}</td>
                              <td className="py-3 capitalize">{r.status}</td>
                              <td className="py-3 text-[#64748B]">{r.timeMarked ?? '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex flex-wrap gap-3 items-center justify-between mb-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Edit Past Attendance</p>
                      <p className="text-sm text-[#64748B]">Choose a previous date to update and override that record.</p>
                    </div>
                  </div>

                  {pastDates.length === 0 ? (
                    <p className="text-sm text-[#64748B]">No past attendance dates available yet.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {pastDates.map((date) => (
                        <Button
                          key={date}
                          size="sm"
                          variant={selectedPastDate === date ? 'default' : 'outline'}
                          onClick={() => loadPastAttendance(date)}
                          disabled={pastLoading}
                        >
                          {date}
                        </Button>
                      ))}
                    </div>
                  )}

                  {editingPastAttendance && selectedPastDate && (
                    <div className="mt-4 space-y-4">
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <p className="font-semibold text-slate-900">Editing attendance for {selectedPastDate}</p>
                        <p className="text-sm text-[#64748B]">This will override the previous record for that date.</p>
                      </div>

                      {pastRecords.length === 0 ? (
                        <p className="text-sm text-[#64748B]">No attendance records were found for that date.</p>
                      ) : (
                        <div className="border rounded-xl divide-y max-h-[340px] overflow-y-auto">
                          {pastRecords.map((row) => (
                            <label
                              key={row.usn}
                              className="flex items-center gap-4 px-4 py-3 hover:bg-[#F8FAFC]"
                            >
                              <Checkbox
                                checked={!!pastPresentMap[row.usn]}
                                onCheckedChange={() => togglePastPresent(row.usn)}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-[#1E293B]">{row.name}</p>
                                <p className="text-xs text-[#64748B] font-mono">{row.usn}</p>
                              </div>
                              <Badge variant={pastPresentMap[row.usn] ? 'default' : 'secondary'}>
                                {pastPresentMap[row.usn] ? 'Present' : 'Absent'}
                              </Badge>
                            </label>
                          ))}
                        </div>
                      )}

                      <div className="flex flex-wrap gap-3">
                        <Button onClick={savePastAttendance} disabled={submittingAtt || pastRecords.length === 0}>
                          {submittingAtt ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : 'Save Past Attendance'}
                        </Button>
                        <Button variant="outline" onClick={() => setEditingPastAttendance(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── View Attendance ── */}
          <TabsContent value="view">
            <Card className="card-shadow">
              <CardHeader>
                <CardTitle>View Attendance — {subjectName || subjectCode}</CardTitle>
                <p className="text-sm text-[#64748B]">Overall percentage per student for your subject only.</p>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                {showSkeleton ? (
                  <SkeletonTable rows={6} cells={4} />
                ) : viewRows.length === 0 ? (
                  <p className="text-[#64748B]">No attendance data yet.</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-[#64748B]">
                        <th className="py-2 pr-4">USN</th>
                        <th className="py-2 pr-4">Name</th>
                        <th className="py-2 pr-4">Today</th>
                        <th className="py-2 pr-4">Overall %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewRows.map((r) => {
                        const shortage = isAttendanceShortage(r.attendance_pct ?? 0);
                        return (
                          <tr
                            key={r.usn}
                            className={cn('border-b', shortage && 'bg-red-50')}
                          >
                            <td className="py-2 font-mono text-xs">{r.usn}</td>
                            <td className="py-2">{r.name}</td>
                            <td className="py-2 capitalize">{r.status}</td>
                            <td className={cn('py-2 font-bold', shortage ? 'text-red-600' : 'text-[#10B981]')}>
                              {r.attendance_pct ?? 0}%
                              {shortage && (
                                <span className="ml-2 text-xs font-normal">{ATTENDANCE_SHORTAGE_LABEL}</span>
                              )}
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

          {/* ── Marks ── */}
          <TabsContent value="marks">
            <Card className="card-shadow">
              <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
                <div>
                  <CardTitle>Marks Management — {subjectCode}</CardTitle>
                  <p className="text-sm text-[#64748B]">CIE1, CIE2, Assignment, and SEE. Internal max 30, SEE max 100.</p>
                </div>
                <Button onClick={saveMarks} disabled={savingMarks || markRows.length === 0 || markRowsHaveErrors}>
                  {savingMarks ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Save All Marks
                </Button>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                {showSkeleton ? (
                  <SkeletonTable rows={6} cells={8} />
                ) : markRows.length === 0 ? (
                  <p className="text-[#64748B]">No students to enter marks for.</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-[#64748B]">
                        <th className="py-2 pr-4">USN</th>
                        <th className="py-2 pr-4">Name</th>
                        <th className="py-2 pr-4">CIE1 /30</th>
                        <th className="py-2 pr-4">CIE2 /30</th>
                        <th className="py-2 pr-4">Assignment /20</th>
                        <th className="py-2 pr-4">SEE /100</th>
                        <th className="py-2 pr-4">Total Internal</th>
                        <th className="py-2 pr-4">Total Marks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {markRows.map((r) => {
                        const totalInternal = Number(r.cie1 || 0) > 0 || Number(r.cie2 || 0) > 0 || Number(r.assignment || 0) > 0
                          ? Number(((Number(r.cie1 || 0) + Number(r.cie2 || 0)) / 2 + Number(r.assignment || 0)).toFixed(1))
                          : 0;
                        const totalMarks = r.see === ''
                          ? null
                          : Number((totalInternal + Number(r.see || 0) / 2).toFixed(1));
                        return (
                          <tr key={r.usn} className="border-b">
                            <td className="py-2 font-mono text-xs">{r.usn}</td>
                            <td className="py-2">{r.name}</td>
                            <td className="py-2 pr-2">
                              <Input
                                type="number"
                                min={0}
                                max={30}
                                className="w-20 h-8"
                                value={r.cie1}
                                onChange={(e) => updateMark(r.usn, 'cie1', e.target.value)}
                                placeholder="—"
                              />
                              {typeof r.cie1 === 'number' && (r.cie1 < 0 || r.cie1 > 30) && (
                                <p className="text-xs text-red-600 mt-1">Enter 0–30</p>
                              )}
                            </td>
                            <td className="py-2 pr-2">
                              <Input
                                type="number"
                                min={0}
                                max={30}
                                className="w-20 h-8"
                                value={r.cie2}
                                onChange={(e) => updateMark(r.usn, 'cie2', e.target.value)}
                                placeholder="—"
                              />
                              {typeof r.cie2 === 'number' && (r.cie2 < 0 || r.cie2 > 30) && (
                                <p className="text-xs text-red-600 mt-1">Enter 0–30</p>
                              )}
                            </td>
                            <td className="py-2 pr-2">
                              <Input
                                type="number"
                                min={0}
                                max={20}
                                className="w-20 h-8"
                                value={r.assignment}
                                onChange={(e) => updateMark(r.usn, 'assignment', e.target.value)}
                                placeholder="—"
                              />
                              {typeof r.assignment === 'number' && (r.assignment < 0 || r.assignment > 20) && (
                                <p className="text-xs text-red-600 mt-1">Enter 0–20</p>
                              )}
                            </td>
                            <td className="py-2 pr-2">
                              <Input
                                type="number"
                                min={0}
                                max={100}
                                className="w-20 h-8"
                                value={r.see}
                                onChange={(e) => updateMark(r.usn, 'see', e.target.value)}
                                placeholder="—"
                              />
                              {typeof r.see === 'number' && (r.see < 0 || r.see > 100) && (
                                <p className="text-xs text-red-600 mt-1">Enter 0–100</p>
                              )}
                            </td>
                            <td className="py-2 pr-2 font-medium">{totalInternal.toFixed(1)}</td>
                            <td className="py-2 pr-2 font-medium text-slate-700">{totalMarks === null ? '-' : totalMarks.toFixed(1)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            {showSkeleton ? (
              <AnalyticsSkeleton />
            ) : !teacherAnalytics ? (
              <Card className="card-shadow">
                <CardContent className="p-6 text-[#64748B]">No analytics data available yet.</CardContent>
              </Card>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Card className="card-shadow">
                    <CardContent className="p-4">
                      <p className="text-sm text-[#64748B]">Total Students</p>
                      <p className="text-2xl font-bold text-[#1E293B]">{teacherAnalytics.summary.totalStudents}</p>
                    </CardContent>
                  </Card>
                  <Card className="card-shadow">
                    <CardContent className="p-4">
                      <p className="text-sm text-[#64748B]">Average Attendance</p>
                      <p className="text-2xl font-bold text-[#1E293B]">{teacherAnalytics.summary.averageAttendance}%</p>
                    </CardContent>
                  </Card>
                  <Card className="card-shadow border-red-200">
                    <CardContent className="p-4">
                      <p className="text-sm text-[#64748B]">Students Below 75%</p>
                      <p className="text-2xl font-bold text-red-600">{teacherAnalytics.summary.below75}</p>
                    </CardContent>
                  </Card>
                  <Card className="card-shadow border-emerald-200">
                    <CardContent className="p-4">
                      <p className="text-sm text-[#64748B]">Students Above 90%</p>
                      <p className="text-2xl font-bold text-emerald-600">{teacherAnalytics.summary.above90}</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-6 xl:grid-cols-2">
                  <Card className="card-shadow">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-[#2563EB]" />
                        Attendance Percentage Per Student
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={teacherAnalytics.students}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={70} />
                          <YAxis domain={[0, 100]} />
                          <Tooltip />
                          <Bar dataKey="percentage" name="Attendance %">
                            {teacherAnalytics.students.map((entry) => (
                              <Cell key={entry.usn} fill={entry.percentage < 75 ? '#EF4444' : '#10B981'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card className="card-shadow">
                    <CardHeader>
                      <CardTitle>Class Average Trend</CardTitle>
                    </CardHeader>
                    <CardContent className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={teacherAnalytics.weekly}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="week" />
                          <YAxis domain={[0, 100]} />
                          <Tooltip />
                          <Line type="monotone" dataKey="average" name="Average %" stroke="#2563EB" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card className="card-shadow xl:col-span-2">
                    <CardHeader>
                      <CardTitle>Regular vs Shortage Students</CardTitle>
                    </CardHeader>
                    <CardContent className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={teacherAnalytics.ratio} dataKey="value" nameKey="name" outerRadius={105} label>
                            {teacherAnalytics.ratio.map((entry, index) => (
                              <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          {/* ── Defaulters ── */}
          <TabsContent value="defaulters">
            <Card className="card-shadow border-red-200">
              <CardHeader>
                <CardTitle className="text-red-700 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Defaulters — Below 75% in {subjectCode}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {defaulters.length === 0 ? (
                  <p className="text-[#64748B]">No students below 75% attendance for this subject.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-red-700">
                          <th className="py-2 pr-4">Student</th>
                          <th className="py-2 pr-4">USN</th>
                          <th className="py-2 pr-4">Attendance</th>
                          <th className="py-2 pr-4">Classes</th>
                          <th className="py-2 pr-4">Prediction</th>
                        </tr>
                      </thead>
                      <tbody>
                        {defaulters.map((d) => (
                          <tr key={d.usn} className="border-b bg-red-50 dark:bg-red-950/30">
                            <td className="py-3 pr-4 font-semibold text-red-900 dark:text-red-200">{d.name}</td>
                            <td className="py-3 pr-4 font-mono text-xs text-red-700 dark:text-red-300">{d.usn}</td>
                            <td className="py-3 pr-4 text-2xl font-bold text-red-600">{d.attendance}%</td>
                            <td className="py-3 pr-4 text-red-700 dark:text-red-300">
                              {d.present} present / {d.total} classes
                            </td>
                            <td className="py-3 pr-4 font-medium text-orange-700 dark:text-orange-300">
                              Attend next {d.classes_needed ?? Math.max(0, Math.ceil(((0.75 * d.total) - d.present) / 0.25))} classes
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Condonation Requests */}
          <TabsContent value="condonation">
            <Card className="card-shadow dark:border-slate-800 dark:bg-slate-950">
              <CardHeader>
                <CardTitle className="dark:text-slate-100">Condonation Requests - {subjectCode}</CardTitle>
                <p className="text-sm text-[#64748B] dark:text-slate-400">
                  Requests from students below 75% attendance in this subject.
                </p>
              </CardHeader>
              <CardContent>
                {showSkeleton ? (
                  <SkeletonTable rows={5} cells={7} />
                ) : condonationRequests.length === 0 ? (
                  <p className="text-[#64748B] dark:text-slate-400">No condonation requests for this subject.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-[#64748B] dark:border-slate-800 dark:text-slate-400">
                          <th className="py-2 pr-3">Student Name</th>
                          <th className="py-2 pr-3">USN</th>
                          <th className="py-2 pr-3">Subject</th>
                          <th className="py-2 pr-3">Reason</th>
                          <th className="py-2 pr-3">Supporting Details</th>
                          <th className="py-2 pr-3">Date Submitted</th>
                          <th className="py-2 pr-3">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {condonationRequests.map((req) => {
                          const studentName =
                            req.student_name ||
                            students.find((student) => student.usn.toUpperCase() === req.usn.toUpperCase())?.name ||
                            'Unknown';
                          const dateSubmitted = req.date_submitted || req.timestamp;

                          return (
                            <tr
                              key={req.id}
                              className={cn(
                                'border-b dark:border-slate-800',
                                req.status === 'pending' && 'bg-amber-50 dark:bg-amber-950/30',
                                req.status === 'approved' && 'bg-emerald-50 dark:bg-emerald-950/30',
                                req.status === 'rejected' && 'bg-red-50 dark:bg-red-950/30',
                              )}
                            >
                              <td className="py-3 pr-3 align-top">
                                <div className="space-y-3">
                                  <div>
                                    <p className="font-medium text-[#1E293B] dark:text-slate-100">{studentName}</p>
                                    <p className="font-mono text-xs text-[#64748B] dark:text-slate-400">{req.usn}</p>
                                  </div>
                                  <RequestDocuments urls={req.document_urls} />
                                </div>
                              </td>
                              <td className="py-3 pr-3 font-mono text-xs dark:text-slate-300">{req.usn}</td>
                              <td className="py-3 pr-3">
                                <div className="font-medium text-[#1E293B] dark:text-slate-100">
                                  {req.subject_name || subjectName || req.subject_code}
                                </div>
                                <div className="font-mono text-xs text-[#64748B] dark:text-slate-400">
                                  {req.subject_code}
                                </div>
                              </td>
                              <td className="py-3 pr-3 text-sm dark:text-slate-200">{req.reason}</td>
                              <td className="py-3 pr-3 text-sm text-[#64748B] dark:text-slate-400 max-w-xs whitespace-normal">
                                {req.supporting_details || '-'}
                              </td>
                              <td className="py-3 pr-3 text-sm text-[#64748B] dark:text-slate-400">
                                {formatDateTime(dateSubmitted)}
                              </td>
                              <td className="py-3 pr-3">
                                {req.status === 'pending' ? (
                                  <div className="flex flex-wrap gap-2">
                                    <Button
                                      size="sm"
                                      className="bg-emerald-600 hover:bg-emerald-700"
                                      onClick={() => {
                                        setRespondingRequestId(req.id);
                                        setRespondingStatus('approved');
                                        setRespondingRemarks('');
                                      }}
                                    >
                                      Approve
                                    </Button>
                                    <Button
                                      size="sm"
                                      className="bg-red-600 hover:bg-red-700"
                                      onClick={() => {
                                        setRespondingRequestId(req.id);
                                        setRespondingStatus('rejected');
                                        setRespondingRemarks('');
                                      }}
                                    >
                                      Reject
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="space-y-1">
                                    {req.status === 'approved' && (
                                      <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
                                        Approved
                                      </Badge>
                                    )}
                                    {req.status === 'rejected' && (
                                      <Badge className="bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200">
                                        Rejected
                                      </Badge>
                                    )}
                                    {req.teacher_remarks && (
                                      <p className="max-w-xs whitespace-normal text-xs text-[#64748B] dark:text-slate-400">
                                        {req.teacher_remarks}
                                      </p>
                                    )}
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            <Dialog
              open={Boolean(respondingRequestId)}
              onOpenChange={(open) => {
                if (!open && !respondingLoading) setRespondingRequestId(null);
              }}
            >
              <DialogContent className="w-full max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {respondingStatus === 'approved' ? 'Approve' : 'Reject'} Condonation Request
                  </DialogTitle>
                  <DialogDescription>
                    {respondingRequest
                      ? `${respondingRequest.usn} - ${respondingRequest.subject_code}`
                      : 'Confirm your response to this request.'}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-2">
                  <Label>
                    {respondingStatus === 'approved' ? 'Optional Remarks' : 'Rejection Reason'}
                    {respondingStatus === 'rejected' && <span className="text-red-500">*</span>}
                  </Label>
                  <Textarea
                    placeholder={
                      respondingStatus === 'approved'
                        ? 'Add any remarks (optional)...'
                        : 'Explain why the request is rejected...'
                    }
                    value={respondingRemarks}
                    onChange={(e) => setRespondingRemarks(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setRespondingRequestId(null)}
                    disabled={respondingLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      if (respondingRequestId) {
                        respondToCondonation(respondingRequestId, respondingStatus, respondingRemarks);
                      }
                    }}
                    disabled={
                      respondingLoading ||
                      (respondingStatus === 'rejected' && !respondingRemarks.trim())
                    }
                    className={
                      respondingStatus === 'approved'
                        ? 'bg-emerald-600 hover:bg-emerald-700'
                        : 'bg-red-600 hover:bg-red-700'
                    }
                  >
                    {respondingLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Confirm {respondingStatus === 'approved' ? 'Approve' : 'Reject'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* ── Notifications Sent ── */}
          <TabsContent value="notifications">
            <Card className="card-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Shortage alert emails — {subjectCode}
                </CardTitle>
                <p className="text-sm text-[#64748B]">
                  Log of emails sent when a student drops below 75% after attendance is marked.
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {alerts.length === 0 ? (
                  <p className="text-[#64748B]">No shortage alerts sent yet for this subject.</p>
                ) : (
                  alerts.map((a) => (
                    <div key={`${a.alert_group_id}-${a.student_usn}-${a.timestamp}`} className="p-4 rounded-xl border bg-white">
                      <div className="flex justify-between gap-2 flex-wrap">
                        <p className="font-medium">
                          {a.student_name} ({a.student_usn})
                        </p>
                        <Badge variant="outline" className="text-red-600 border-red-200">
                          {a.attendance_pct}%
                        </Badge>
                      </div>
                      <p className="text-sm text-[#64748B] mt-1">
                        {a.subject_code} — {a.subject_name}
                      </p>
                      <p className="text-xs text-[#64748B] mt-1">Email: {a.email_status ?? '—'} · {a.timestamp}</p>
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

export default function TeacherDashboardPage() {
  return (
    <Suspense fallback={<div className="p-8"><Skeleton className="h-32 rounded-xl" /></div>}>
      <TeacherDashboardContent />
    </Suspense>
  );
}
