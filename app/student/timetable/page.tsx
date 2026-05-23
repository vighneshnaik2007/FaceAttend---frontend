'use client';

import { useCallback, useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { WeeklyTimetableGrid, statusCardClass, todayName, type SlotStatus } from '@/components/timetable/timetable-ui';
import { apiGetSectionTimetable, apiGetStudent, type TimetableEntry } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';

function sectionDocumentId(section?: string, semester?: string | number) {
  const cleanSection = (section ?? '').toUpperCase();
  return semester && cleanSection ? `SEM${semester}_${cleanSection}` : cleanSection;
}

export default function StudentTimetablePage() {
  const { user } = useAuth();
  const usn = user?.usn ?? '';
  const [sectionId, setSectionId] = useState(sectionDocumentId(user?.section, user?.semester));
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(todayName());

  const loadProfile = useCallback(() => {
    if (!usn) return Promise.resolve();
    return apiGetStudent(usn)
      .then((profile: { section?: string; semester?: string | number }) => setSectionId(sectionDocumentId(profile.section ?? user?.section, profile.semester ?? user?.semester)))
      .catch(() => setSectionId(sectionDocumentId(user?.section, user?.semester)));
  }, [usn, user?.section, user?.semester]);

  const loadTimetable = useCallback(() => {
    if (!sectionId) {
      setEntries([]);
      setLoading(false);
      return Promise.resolve();
    }
    setLoading(true);
    return apiGetSectionTimetable(sectionId)
      .then((res) => setEntries(res.entries ?? []))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [sectionId]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    loadTimetable();
  }, [loadTimetable]);

  const renderEntry = (entry: TimetableEntry, status: SlotStatus) => (
    <div className={statusCardClass(status)}>
      <p className="font-semibold">{entry.subject_name}</p>
      <p className="mt-1 text-xs opacity-80">{entry.teacher_name}</p>
      <p className="mt-1 text-xs opacity-75">Room {entry.room_number || entry.room}</p>
      {entry.is_holiday && <p className="mt-2 text-xs font-semibold text-orange-700 dark:text-orange-200">Holiday{entry.holiday_reason ? ` - ${entry.holiday_reason}` : ''}</p>}
    </div>
  );

  return (
    <main className="space-y-6 p-4 sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">My Timetable</h1>
          <p className="text-slate-500 dark:text-slate-400">Weekly timetable for your section.</p>
        </div>
        <Button variant="outline" className="min-h-11" onClick={loadTimetable} disabled={loading}>
          <RefreshCw className={cn('mr-2 h-4 w-4', loading && 'animate-spin')} />
          Refresh
        </Button>
      </div>
      {!loading && !sectionId ? (
        <Card className="border-dashed dark:border-slate-800"><CardContent className="p-10 text-center text-slate-500">Section not assigned. Please contact administrator.</CardContent></Card>
      ) : !loading && entries.length === 0 ? (
        <Card className="border-dashed dark:border-slate-800"><CardContent className="p-10 text-center text-slate-500">No classes scheduled for your section.</CardContent></Card>
      ) : (
        <WeeklyTimetableGrid
          title={sectionId ? `Weekly Timetable - ${sectionId}` : 'Weekly Timetable'}
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
