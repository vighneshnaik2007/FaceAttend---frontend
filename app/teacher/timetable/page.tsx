'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { WeeklyTimetableGrid, statusCardClass, todayName, type SlotStatus } from '@/components/timetable/timetable-ui';
import { apiGetTeacherTimetable, type TimetableEntry } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';

export default function TeacherTimetablePage() {
  const { user } = useAuth();
  const teacherId = user?.teacherId ?? user?.id ?? '';
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(todayName());

  const loadTimetable = useCallback(() => {
    if (!teacherId) {
      setEntries([]);
      setLoading(false);
      return Promise.resolve();
    }
    setLoading(true);
    return apiGetTeacherTimetable(teacherId)
      .then((res) => setEntries(res.entries ?? []))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [teacherId]);

  useEffect(() => {
    loadTimetable();
  }, [loadTimetable]);

  const hasEntries = useMemo(() => entries.length > 0, [entries]);

  const renderEntry = (entry: TimetableEntry, status: SlotStatus) => (
    <div className={statusCardClass(status)}>
      <p className="font-semibold">{entry.subject_name}</p>
      <p className="mt-1 text-xs opacity-80">{entry.section_name || entry.section}</p>
      <p className="mt-1 text-xs opacity-75">Room {entry.room_number || entry.room}</p>
      {entry.is_holiday && <p className="mt-2 text-xs font-semibold text-orange-700 dark:text-orange-200">Holiday{entry.holiday_reason ? ` - ${entry.holiday_reason}` : ''}</p>}
    </div>
  );

  return (
    <main className="space-y-6 p-4 sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">My Timetable</h1>
          <p className="text-slate-500 dark:text-slate-400">Weekly classes across all assigned sections.</p>
        </div>
        <Button variant="outline" className="min-h-11" onClick={loadTimetable} disabled={loading}>
          <RefreshCw className={cn('mr-2 h-4 w-4', loading && 'animate-spin')} />
          Refresh
        </Button>
      </div>
      {!loading && !hasEntries ? (
        <Card className="border-dashed dark:border-slate-800"><CardContent className="p-10 text-center text-slate-500">No classes scheduled for this teacher.</CardContent></Card>
      ) : (
        <WeeklyTimetableGrid
          title="Weekly Timetable"
          entries={entries}
          loading={loading}
          selectedDay={selectedDay}
          onSelectedDayChange={setSelectedDay}
          renderEntry={renderEntry}
        />
      )}
    </main>
  );
}
