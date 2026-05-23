'use client';

import { useState } from 'react';
import { TeacherHeader } from '@/components/teacher/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth-context';
import { apiDailyReport, apiMonthlyReport } from '@/lib/api';

export default function TeacherReportsPage() {
  const { user } = useAuth();
  const subjectCode = user?.subject_code ?? user?.assignedSubject?.code ?? '';
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [report, setReport] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  const loadDaily = async () => {
    if (!subjectCode) return;
    setLoading(true);
    try {
      const data = await apiDailyReport(subjectCode, date);
      setReport(data);
    } catch {
      setReport(null);
    }
    setLoading(false);
  };

  const loadMonthly = async () => {
    if (!subjectCode) return;
    setLoading(true);
    const d = new Date(date);
    try {
      const data = await apiMonthlyReport(subjectCode, d.getFullYear(), d.getMonth() + 1);
      setReport(data);
    } catch {
      setReport(null);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen">
      <TeacherHeader title="Reports" />
      <main className="p-4 sm:p-6 space-y-6 max-w-3xl">
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle>Generate report — {subjectCode || 'no subject'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Button onClick={loadDaily} disabled={loading || !subjectCode}>
                Daily
              </Button>
              <Button variant="outline" onClick={loadMonthly} disabled={loading || !subjectCode}>
                Monthly
              </Button>
            </div>
          </CardContent>
        </Card>
        {report && (
          <Card className="card-shadow">
            <CardContent className="p-4">
              <pre className="text-xs overflow-auto">{JSON.stringify(report, null, 2)}</pre>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
