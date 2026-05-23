'use client';

import { CalendarDays } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { TimetableEntry } from '@/lib/api';
import { getSlotStatus, sortByTime, StatusBadge, useNow } from './timetable-ui';

type Props = {
  title: string;
  entries: TimetableEntry[];
  loading?: boolean;
  emptyText?: string;
  mode: 'teacher' | 'student';
};

export function TodayScheduleWidget({ title, entries, loading, emptyText = 'No classes scheduled for today', mode }: Props) {
  const now = useNow();
  const sorted = sortByTime(entries);

  return (
    <Card className="card-shadow dark:border-slate-800 dark:bg-slate-950">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 dark:text-slate-100">
          <CalendarDays className="h-5 w-5 text-blue-600" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-28 rounded-lg" />)}
          </div>
        ) : sorted.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400">{emptyText}</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {sorted.map((entry) => {
              const status = getSlotStatus(entry, now);
              return (
                <div
                  key={entry.id}
                  className={cn(
                    'rounded-lg border p-4 transition hover:-translate-y-0.5 hover:shadow-md',
                    status === 'upcoming' && 'border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30',
                    status === 'ongoing' && 'border-emerald-300 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30',
                    status === 'completed' && 'border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900',
                    status === 'holiday' && 'border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/30',
                    status === 'normal' && 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950',
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{entry.time_slot}</p>
                    <StatusBadge status={status} />
                  </div>
                  <p className="mt-3 font-medium text-slate-900 dark:text-slate-100">{entry.subject_name}</p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    {mode === 'teacher' ? entry.section_name || entry.section : entry.teacher_name}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Room {entry.room_number || entry.room}</p>
                  {entry.is_holiday && entry.holiday_reason && (
                    <p className="mt-2 text-xs font-medium text-orange-700 dark:text-orange-200">{entry.holiday_reason}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
