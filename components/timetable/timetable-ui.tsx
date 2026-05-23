'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { TimetableEntry } from '@/lib/api';

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const SHORT_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const TIME_SLOTS = [
  '8:00-9:00 AM',
  '9:00-10:00 AM',
  '10:00-11:00 AM',
  '11:00-12:00 PM',
  '12:00-1:00 PM',
  '1:00-2:00 PM',
  '2:00-3:00 PM',
  '3:00-4:00 PM',
  '4:00-5:00 PM',
];

export type SlotStatus = 'upcoming' | 'ongoing' | 'completed' | 'holiday' | 'normal';

export function useNow(tickMs = 30000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), tickMs);
    return () => window.clearInterval(interval);
  }, [tickMs]);
  return now;
}

export function todayName(now = new Date()) {
  return now.toLocaleDateString('en-US', { weekday: 'long' });
}

function parseTimePart(part: string) {
  const match = part.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const ampm = match[3].toUpperCase();
  if (ampm === 'PM' && hour !== 12) hour += 12;
  if (ampm === 'AM' && hour === 12) hour = 0;
  return { hour, minute };
}

export function slotBounds(slot: string, date = new Date()) {
  const [startRaw, endRaw] = slot.split('-');
  if (!startRaw || !endRaw) return null;
  const startPeriod = endRaw.match(/\s*(AM|PM)\s*$/i)?.[1] || '';
  const start = parseTimePart(`${startRaw.trim()} ${startPeriod}`);
  const end = parseTimePart(endRaw.trim());
  if (!start || !end) return null;
  const startDate = new Date(date);
  startDate.setHours(start.hour, start.minute, 0, 0);
  const endDate = new Date(date);
  endDate.setHours(end.hour, end.minute, 0, 0);
  return { start: startDate, end: endDate };
}

export function getSlotStatus(entry: Pick<TimetableEntry, 'day' | 'time_slot' | 'is_holiday'>, now = new Date()): SlotStatus {
  if (entry.is_holiday) return 'holiday';
  if (entry.day !== todayName(now)) return 'normal';
  const bounds = slotBounds(entry.time_slot, now);
  if (!bounds) return 'normal';
  if (now < bounds.start) return 'upcoming';
  if (now >= bounds.start && now < bounds.end) return 'ongoing';
  return 'completed';
}

export function currentTimePercent(now = new Date()) {
  const first = slotBounds(TIME_SLOTS[0], now);
  const last = slotBounds(TIME_SLOTS[TIME_SLOTS.length - 1], now);
  if (!first || !last || now < first.start || now > last.end) return null;
  return ((now.getTime() - first.start.getTime()) / (last.end.getTime() - first.start.getTime())) * 100;
}

export function currentTimePercentInSlot(slot: string, now = new Date()) {
  const bounds = slotBounds(slot, now);
  if (!bounds || now < bounds.start || now > bounds.end) return null;
  return ((now.getTime() - bounds.start.getTime()) / (bounds.end.getTime() - bounds.start.getTime())) * 100;
}

export function sortByTime<T extends { time_slot: string }>(items: T[]) {
  return [...items].sort((a, b) => TIME_SLOTS.indexOf(a.time_slot) - TIME_SLOTS.indexOf(b.time_slot));
}

export function StatusBadge({ status }: { status: SlotStatus }) {
  const label = status === 'normal' ? 'UPCOMING' : status.toUpperCase();
  return (
    <Badge
      className={cn(
        'gap-1 border px-2 py-1 text-[11px]',
        status === 'upcoming' && 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200',
        status === 'ongoing' && 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200',
        status === 'completed' && 'border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300',
        status === 'holiday' && 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900 dark:bg-orange-950/40 dark:text-orange-200',
        status === 'normal' && 'border-slate-200 bg-white text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300',
      )}
    >
      {status === 'ongoing' && <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />}
      {label}
    </Badge>
  );
}

export function TimetableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <Skeleton key={index} className="h-20 rounded-lg" />
      ))}
    </div>
  );
}

type WeeklyGridProps = {
  entries: TimetableEntry[];
  loading?: boolean;
  title: string;
  renderEntry: (entry: TimetableEntry, status: SlotStatus) => ReactNode;
  renderEmpty?: (day: string, slot: string) => ReactNode;
  selectedDay: string;
  onSelectedDayChange: (day: string) => void;
};

export function WeeklyTimetableGrid({
  entries,
  loading,
  title,
  renderEntry,
  renderEmpty,
  selectedDay,
  onSelectedDayChange,
}: WeeklyGridProps) {
  const now = useNow();
  const today = todayName(now);
  const byCell = useMemo(() => {
    const map = new Map<string, TimetableEntry>();
    entries.forEach((entry) => map.set(`${entry.day}|${entry.time_slot}`, entry));
    return map;
  }, [entries]);
  const dayIndex = Math.max(0, DAYS.indexOf(selectedDay));
  const shiftDay = (offset: number) => onSelectedDayChange(DAYS[(dayIndex + offset + DAYS.length) % DAYS.length]);

  return (
    <Card className="card-shadow dark:border-slate-800 dark:bg-slate-950">
      <CardHeader className="space-y-4">
        <CardTitle className="flex items-center gap-2 dark:text-slate-100">
          <Clock className="h-5 w-5 text-blue-600" />
          {title}
        </CardTitle>
        <div className="flex gap-2 overflow-x-auto">
          {DAYS.map((day, index) => (
            <Button
              key={day}
              type="button"
              variant={selectedDay === day ? 'default' : 'outline'}
              className="min-h-11 min-w-14"
              onClick={() => onSelectedDayChange(day)}
            >
              {SHORT_DAYS[index]}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <TimetableSkeleton />
        ) : (
          <>
            <div className="md:hidden space-y-3">
              <div className="flex items-center justify-between gap-3">
                <Button type="button" variant="outline" size="icon" className="min-h-11 min-w-11" onClick={() => shiftDay(-1)} aria-label="Previous day">
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <p className="font-semibold dark:text-slate-100">{selectedDay}</p>
                <Button type="button" variant="outline" size="icon" className="min-h-11 min-w-11" onClick={() => shiftDay(1)} aria-label="Next day">
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
              {TIME_SLOTS.map((slot) => {
                const entry = byCell.get(`${selectedDay}|${slot}`);
                const lineTop = selectedDay === today ? currentTimePercentInSlot(slot, now) : null;
                return (
                  <div key={slot} className="relative rounded-lg border p-3 transition hover:shadow-md dark:border-slate-800">
                    {lineTop !== null && (
                      <span
                        className="pointer-events-none absolute left-0 right-0 z-20 h-0.5 bg-red-500 shadow-[0_0_0_1px_rgba(239,68,68,0.18)]"
                        style={{ top: `${lineTop}%` }}
                      />
                    )}
                    <p className="mb-2 text-sm font-semibold text-slate-500 dark:text-slate-400">{slot}</p>
                    {entry ? renderEntry(entry, getSlotStatus(entry, now)) : renderEmpty?.(selectedDay, slot) ?? <p className="text-sm text-slate-400">No class</p>}
                  </div>
                );
              })}
            </div>

            <div className="relative hidden overflow-x-auto md:block">
              <div className="grid min-w-[980px] grid-cols-[140px_repeat(6,minmax(130px,1fr))] gap-2">
                <div />
                {DAYS.map((day) => (
                  <div key={day} className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                    {day}
                  </div>
                ))}
                {TIME_SLOTS.map((slot) => (
                  <div key={slot} className="contents">
                    <div className="rounded-lg bg-slate-50 px-3 py-4 text-sm font-semibold text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                      {slot}
                    </div>
                    {DAYS.map((day) => {
                      const entry = byCell.get(`${day}|${slot}`);
                      const lineTop = day === today ? currentTimePercentInSlot(slot, now) : null;
                      return (
                        <div key={`${day}-${slot}`} className="relative min-h-28 rounded-lg border bg-white p-2 transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-950">
                          {lineTop !== null && (
                            <span
                              className="pointer-events-none absolute left-0 right-0 z-20 h-0.5 bg-red-500 shadow-[0_0_0_1px_rgba(239,68,68,0.18)]"
                              style={{ top: `${lineTop}%` }}
                            />
                          )}
                          {entry ? renderEntry(entry, getSlotStatus(entry, now)) : renderEmpty?.(day, slot) ?? <p className="text-xs text-slate-400">No class</p>}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function statusCardClass(status: SlotStatus) {
  return cn(
    'h-full rounded-lg border p-3 transition',
    status === 'upcoming' && 'border-blue-200 bg-blue-50 text-blue-950 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-100',
    status === 'ongoing' && 'border-emerald-300 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-300 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100 animate-pulse',
    status === 'completed' && 'border-slate-200 bg-slate-100 text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400',
    status === 'holiday' && 'border-orange-200 bg-orange-50 text-orange-950 dark:border-orange-900 dark:bg-orange-950/40 dark:text-orange-100',
    status === 'normal' && 'border-slate-200 bg-white text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100',
  );
}
