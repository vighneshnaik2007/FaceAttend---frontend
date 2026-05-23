'use client';

import { useEffect, useState } from 'react';
import { TeacherHeader } from '@/components/teacher/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiShortageAlertsLog, ShortageAlertLogRow } from '@/lib/api';
import { Loader2, Mail, ShieldAlert } from 'lucide-react';

function statusBadge(status: string | null) {
  if (!status) return <span className="text-muted-foreground">—</span>;
  const ok = status === 'sent';
  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
        ok ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
      }`}
    >
      {status}
    </span>
  );
}

export default function NotificationsSentPage() {
  const [rows, setRows] = useState<ShortageAlertLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await apiShortageAlertsLog(300);
        if (!cancelled) setRows(data.alerts ?? []);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load alerts');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen">
      <TeacherHeader title="Notifications Sent" />

      <main className="p-4 sm:p-6 space-y-6">
        <Card className="card-shadow border-l-4 border-l-amber-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-600" />
              Proof of shortage email alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[#64748B]">
              Each row is one automated shortage run (attendance below 75% in a subject). Status comes from
              your FaceAttend API log in Firestore — use this as evidence for lecturers and the department.
            </p>
          </CardContent>
        </Card>

        <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email alert log
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading && (
              <div className="flex items-center gap-2 text-[#64748B] py-8 justify-center">
                <Loader2 className="w-5 h-5 animate-spin" />
                Loading…
              </div>
            )}
            {error && <p className="text-red-600 text-sm py-4">{error}</p>}
            {!loading && !error && rows.length === 0 && (
              <p className="text-sm text-[#64748B] py-4">No shortage alerts logged yet.</p>
            )}
            {!loading && !error && rows.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#E2E8F0] text-left text-[#64748B]">
                      <th className="py-3 pr-4 font-medium">Student</th>
                      <th className="py-3 pr-4 font-medium">Subject</th>
                      <th className="py-3 pr-4 font-medium">Date / time (UTC)</th>
                      <th className="py-3 pr-4 font-medium">%</th>
                      <th className="py-3 pr-4 font-medium">Email status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.alert_group_id} className="border-b border-[#E2E8F0]/80 hover:bg-gray-50/80">
                        <td className="py-3 pr-4">
                          <div className="font-medium text-[#1E293B]">{r.student_name}</div>
                          <div className="text-xs text-[#64748B] font-mono">{r.student_usn}</div>
                        </td>
                        <td className="py-3 pr-4">
                          <div className="font-medium text-[#1E293B]">{r.subject_name}</div>
                          <div className="text-xs text-[#64748B] font-mono">{r.subject_code}</div>
                        </td>
                        <td className="py-3 pr-4 text-[#64748B] whitespace-nowrap">
                          {r.timestamp
                            ? new Date(r.timestamp).toLocaleString(undefined, {
                                dateStyle: 'medium',
                                timeStyle: 'short',
                              })
                            : '—'}
                        </td>
                        <td className="py-3 pr-4 font-semibold text-red-600">{r.attendance_pct}%</td>
                        <td className="py-3 pr-4">{statusBadge(r.email_status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
