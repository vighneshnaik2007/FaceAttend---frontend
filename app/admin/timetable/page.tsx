'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CalendarX, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  DAYS,
  TIME_SLOTS,
  WeeklyTimetableGrid,
  statusCardClass,
  todayName,
  type SlotStatus,
} from '@/components/timetable/timetable-ui';
import {
  apiAddTimetableEntry,
  apiAdminGetTeachers,
  apiDeleteTimetableEntry,
  apiGetSectionTimetable,
  apiMarkTimetableHoliday,
  apiTimetableSections,
  apiUpdateTimetableEntry,
  type AdminTeacher,
  type TimetableEntry,
  type TimetableSection,
} from '@/lib/api';

type FormState = {
  id?: string;
  day: string;
  time_slot: string;
  subject_name: string;
  teacher_id: string;
  teacher_name: string;
  room_number: string;
};

const emptyForm: FormState = {
  day: 'Monday',
  time_slot: TIME_SLOTS[0],
  subject_name: '',
  teacher_id: '',
  teacher_name: '',
  room_number: '',
};

function sectionTitle(section: TimetableSection) {
  return section.label || `${section.semester ? `${section.semester} SEM - ` : ''}Section ${section.section_name}`;
}

export default function AdminTimetablePage() {
  const [sections, setSections] = useState<TimetableSection[]>([]);
  const [teachers, setTeachers] = useState<AdminTeacher[]>([]);
  const [selectedSection, setSelectedSection] = useState<TimetableSection | null>(null);
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [selectedDay, setSelectedDay] = useState(todayName());
  const [loadingSections, setLoadingSections] = useState(true);
  const [loadingGrid, setLoadingGrid] = useState(false);
  const [entryDialogOpen, setEntryDialogOpen] = useState(false);
  const [holidayDialogOpen, setHolidayDialogOpen] = useState(false);
  const [holidayEntry, setHolidayEntry] = useState<TimetableEntry | null>(null);
  const [holidayReason, setHolidayReason] = useState('');
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  const loadSections = useCallback(() => {
    setLoadingSections(true);
    return Promise.all([apiTimetableSections(), apiAdminGetTeachers()])
      .then(([sectionRes, teacherRows]) => {
        setSections(sectionRes.sections ?? []);
        setTeachers(teacherRows ?? []);
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : 'Failed to load timetable setup'))
      .finally(() => setLoadingSections(false));
  }, []);

  const loadEntries = useCallback((sectionId: string) => {
    setLoadingGrid(true);
    return apiGetSectionTimetable(sectionId)
      .then((res) => setEntries(res.entries ?? []))
      .catch((e) => {
        setEntries([]);
        toast.error(e instanceof Error ? e.message : 'Failed to load timetable');
      })
      .finally(() => setLoadingGrid(false));
  }, []);

  useEffect(() => {
    loadSections();
  }, [loadSections]);

  const openSection = (section: TimetableSection) => {
    setSelectedSection(section);
    setSelectedDay(todayName());
    loadEntries(section.section_id || section.id);
  };

  const teacherMap = useMemo(() => new Map(teachers.map((teacher) => [teacher.teacher_id, teacher])), [teachers]);

  const openAdd = (day: string, timeSlot: string) => {
    setForm({ ...emptyForm, day, time_slot: timeSlot });
    setEntryDialogOpen(true);
  };

  const openEdit = (entry: TimetableEntry) => {
    setForm({
      id: entry.id,
      day: entry.day,
      time_slot: entry.time_slot,
      subject_name: entry.subject_name,
      teacher_id: entry.teacher_id,
      teacher_name: entry.teacher_name,
      room_number: entry.room_number || entry.room || '',
    });
    setEntryDialogOpen(true);
  };

  const selectTeacher = (teacherId: string) => {
    const teacher = teacherMap.get(teacherId);
    setForm((prev) => ({
      ...prev,
      teacher_id: teacherId,
      teacher_name: teacher?.name || teacherId,
    }));
  };

  const saveEntry = async () => {
    if (!selectedSection) return;
    if (!form.day || !form.time_slot || !form.subject_name.trim() || !form.teacher_id || !form.room_number.trim()) {
      toast.error('Fill all timetable entry fields');
      return;
    }
    const payload = {
      section_id: selectedSection.section_id || selectedSection.id,
      section_name: sectionTitle(selectedSection),
      day: form.day,
      time_slot: form.time_slot,
      subject_name: form.subject_name.trim(),
      teacher_id: form.teacher_id,
      teacher_name: form.teacher_name,
      room_number: form.room_number.trim(),
    };
    setSaving(true);
    try {
      if (form.id) {
        await apiUpdateTimetableEntry(form.id, payload);
        toast.success('Timetable slot updated');
      } else {
        await apiAddTimetableEntry(payload);
        toast.success('Timetable slot added');
      }
      setEntryDialogOpen(false);
      await loadEntries(payload.section_id);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save slot');
    } finally {
      setSaving(false);
    }
  };

  const deleteEntry = async (entry: TimetableEntry) => {
    if (!selectedSection) return;
    if (!window.confirm('Delete this timetable slot?')) return;
    setSaving(true);
    try {
      await apiDeleteTimetableEntry(entry.id);
      toast.success('Timetable slot deleted');
      await loadEntries(selectedSection.section_id || selectedSection.id);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete slot');
    } finally {
      setSaving(false);
    }
  };

  const markHoliday = async () => {
    if (!holidayEntry || !selectedSection) return;
    setSaving(true);
    try {
      await apiMarkTimetableHoliday(holidayEntry.id, holidayReason);
      toast.success('Slot marked as holiday');
      setHolidayDialogOpen(false);
      await loadEntries(selectedSection.section_id || selectedSection.id);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to mark holiday');
    } finally {
      setSaving(false);
    }
  };

  const renderEntry = (entry: TimetableEntry, status: SlotStatus) => (
    <div className={statusCardClass(status)}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-semibold">{entry.subject_name}</p>
          <p className="truncate text-xs opacity-80">{entry.teacher_name}</p>
          <p className="mt-1 text-xs opacity-75">Room {entry.room_number || entry.room}</p>
          {entry.is_holiday && <p className="mt-1 text-xs font-semibold text-orange-700 dark:text-orange-200">Holiday{entry.holiday_reason ? ` - ${entry.holiday_reason}` : ''}</p>}
        </div>
        <div className="flex shrink-0 gap-1">
          <Button type="button" size="icon" variant="ghost" className="min-h-11 min-w-11" aria-label="Edit slot" onClick={() => openEdit(entry)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="min-h-11 min-w-11 text-orange-600"
            aria-label="Mark holiday"
            onClick={() => {
              setHolidayEntry(entry);
              setHolidayReason(entry.holiday_reason || '');
              setHolidayDialogOpen(true);
            }}
          >
            <CalendarX className="h-4 w-4" />
          </Button>
          <Button type="button" size="icon" variant="ghost" className="min-h-11 min-w-11 text-red-600" aria-label="Delete slot" onClick={() => deleteEntry(entry)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  if (!selectedSection) {
    return (
      <main className="space-y-6 p-4 sm:p-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Timetable</h1>
          <p className="text-slate-500 dark:text-slate-400">Choose a section to build its weekly timetable.</p>
        </div>
        {loadingSections ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => <Card key={index} className="h-28 animate-pulse" />)}
          </div>
        ) : sections.length === 0 ? (
          <Card className="border-dashed dark:border-slate-800"><CardContent className="p-10 text-center text-slate-500">No sections created yet.</CardContent></Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {sections.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => openSection(section)}
                className="min-h-28 rounded-lg border bg-white p-5 text-left transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-950 dark:hover:border-blue-800"
              >
                <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{sectionTitle(section)}</p>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Open weekly timetable</p>
              </button>
            ))}
          </div>
        )}
      </main>
    );
  }

  return (
    <main className="space-y-6 p-4 sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Button type="button" variant="ghost" className="mb-2 min-h-11" onClick={() => setSelectedSection(null)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{sectionTitle(selectedSection)}</h1>
          <p className="text-slate-500 dark:text-slate-400">Click a slot to add, edit, mark holiday, or delete.</p>
        </div>
      </div>

      <WeeklyTimetableGrid
        title="Weekly Timetable"
        entries={entries}
        loading={loadingGrid}
        selectedDay={selectedDay}
        onSelectedDayChange={setSelectedDay}
        renderEntry={renderEntry}
        renderEmpty={(day, slot) => (
          <Button type="button" variant="outline" className="min-h-11 w-full" onClick={() => openAdd(day, slot)}>
            <Plus className="mr-2 h-4 w-4" />
            Add
          </Button>
        )}
      />

      <Dialog open={entryDialogOpen} onOpenChange={setEntryDialogOpen}>
        <DialogContent className="w-full max-w-lg">
          <DialogHeader>
            <DialogTitle>{form.id ? 'Edit Timetable Slot' : 'Add Timetable Slot'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Day</Label>
              <Input value={form.day} readOnly className="bg-slate-50 dark:bg-slate-900" />
            </div>
            <div className="space-y-2">
              <Label>Time Slot</Label>
              <Select value={form.time_slot} onValueChange={(time_slot) => setForm((prev) => ({ ...prev, time_slot }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIME_SLOTS.map((slot) => <SelectItem key={slot} value={slot}>{slot}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Subject Name</Label>
              <Input value={form.subject_name} onChange={(e) => setForm((prev) => ({ ...prev, subject_name: e.target.value }))} placeholder="Database Management Systems" />
            </div>
            <div className="space-y-2">
              <Label>Teacher</Label>
              <Select value={form.teacher_id || undefined} onValueChange={selectTeacher}>
                <SelectTrigger><SelectValue placeholder="Select teacher" /></SelectTrigger>
                <SelectContent>
                  {teachers.map((teacher) => <SelectItem key={teacher.teacher_id} value={teacher.teacher_id}>{teacher.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Room Number</Label>
              <Input value={form.room_number} onChange={(e) => setForm((prev) => ({ ...prev, room_number: e.target.value }))} placeholder="Room 204" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEntryDialogOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={saveEntry} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={holidayDialogOpen} onOpenChange={setHolidayDialogOpen}>
        <DialogContent className="w-full max-w-md">
          <DialogHeader><DialogTitle>Mark Slot as Holiday</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label>Reason Optional</Label>
            <Textarea value={holidayReason} onChange={(e) => setHolidayReason(e.target.value)} placeholder="Department event, public holiday..." />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHolidayDialogOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={markHoliday} disabled={saving} className="bg-orange-600 hover:bg-orange-700">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Mark Holiday
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
