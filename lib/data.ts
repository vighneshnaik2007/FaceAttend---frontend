/**
 * No demo data — types and empty stubs only.
 * All live data comes from the Flask API (lib/api.ts).
 */

export type {
  Student,
  Subject,
  DaySchedule,
  TimetableSlot,
  AttendanceRecord,
  CIEMarks,
  SubjectAttendance,
  Notification,
  WeeklyAttendance,
  Teacher,
} from './types';

import type {
  Student,
  Subject,
  DaySchedule,
  SubjectAttendance,
  Notification,
  AttendanceRecord,
  CIEMarks,
  WeeklyAttendance,
} from './types';

export const students: Student[] = [];
export const subjects: Subject[] = [];
export const timetable: DaySchedule[] = [];
export const esc23xOptions: { code: string; name: string }[] = [];
export const studentSubjectAttendance: SubjectAttendance[] = [];
export const recentNotifications: Notification[] = [];
export const defaulterStudents: Student[] = [];
export const cieMarks: CIEMarks[] = [];
export const vaibhavCIEMarks: {
  subjectCode: string;
  subjectName: string;
  cie1: number;
  cie2: number;
  cie3: number;
}[] = [];
export const weeklyAttendanceData: WeeklyAttendance[] = [];
export const monthlyAttendanceData: { week: string; attendance: number }[] = [];
export const subjectWiseAttendance: { code: string; name: string; attendance: number; color: string }[] = [];

export const ATTENDANCE_SHORTAGE_THRESHOLD = 75;
export const ATTENDANCE_SHORTAGE_LABEL = '⚠️ Shortage - Below 75%';

export function isAttendanceShortage(pct: number): boolean {
  return pct < ATTENDANCE_SHORTAGE_THRESHOLD;
}

export function getSubjectByCode(_code: string): Subject | undefined {
  return undefined;
}

export function getAttendancePctForSubject(_usn: string, _subjectCode: string): number {
  return 0;
}

export function generateAttendanceHistory(): AttendanceRecord[] {
  return [];
}
