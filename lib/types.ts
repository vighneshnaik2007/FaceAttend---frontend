export interface Student {
  id: string;
  name: string;
  usn: string;
  email: string;
  phone: string;
  section: string;
  semester: number;
  department: string;
  attendance: number;
  cgpa: number;
  profileImage?: string;
  faceRegistered: boolean;
  address: string;
  joinedDate: string;
}

export interface Subject {
  code: string;
  name: string;
  shortName: string;
  contactHours: number;
  color: string;
}

export interface TimetableSlot {
  subject: string;
  startTime: string;
  endTime: string;
  type: 'lecture' | 'lab' | 'tutorial' | 'lunch';
}

export interface DaySchedule {
  day: string;
  slots: TimetableSlot[];
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  usn: string;
  subjectCode: string;
  date: string;
  status: 'present' | 'absent';
  timeMarked?: string;
  markedBy: string;
}

export interface CIEMarks {
  studentId: string;
  subjectCode: string;
  cie1: number;
  cie2: number;
  cie3: number;
}

export interface SubjectAttendance {
  subjectCode: string;
  subjectName: string;
  totalClasses: number;
  present: number;
  absent: number;
  percentage: number;
}

export interface Notification {
  id: string;
  type: 'attendance' | 'warning' | 'marks' | 'info';
  message: string;
  timestamp: string;
  read: boolean;
  icon: string;
}

export interface WeeklyAttendance {
  day: string;
  present: number;
  absent: number;
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
  department: string;
  avatar?: string;
}
