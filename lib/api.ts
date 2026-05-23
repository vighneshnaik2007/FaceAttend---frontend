// lib/api.ts
// All API calls to Flask backend — replace lib/data.ts imports with these

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");

type ApiMessage = {
  success?: boolean;
  message?: string;
  error?: string;
};

export class ApiRequestError extends Error {
  status?: number;
  isNetworkError?: boolean;

  constructor(message: string, options?: { status?: number; isNetworkError?: boolean }) {
    super(message);
    this.name = "ApiRequestError";
    this.status = options?.status;
    this.isNetworkError = options?.isNetworkError;
  }
}

async function fetchAPI<T = any>(path: string, options?: RequestInit): Promise<T> {
  if (!API_BASE) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured");
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", ...options?.headers },
    });
  } catch {
    throw new ApiRequestError("Cannot connect to server. Make sure backend is running.", {
      isNetworkError: true,
    });
  }

  const data = (await res.json().catch(() => ({}))) as T & ApiMessage;
  if (!res.ok) {
    throw new ApiRequestError(data.message || data.error || `API error ${res.status}`, {
      status: res.status,
    });
  }
  return data;
}

// ── AUTH ─────────────────────────────────────────────────────────────────────
export async function apiLogin(
  email: string,
  password: string,
  role: "teacher" | "student" | "admin",
) {
  return fetchAPI("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password, role }),
  });
}

export async function apiLogout() {
  return fetchAPI("/api/auth/logout", { method: "POST" });
}

export async function apiForgotPassword(payload: { email?: string; usn?: string }) {
  return fetchAPI("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify(payload),
  }) as Promise<ApiMessage>;
}

export async function apiHealth() {
  if (!API_BASE) return false;
  try {
    const res = await fetch(`${API_BASE}/api/health`, {
      method: "GET",
      cache: "no-store",
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function apiVerifyOtp(payload: {
  email_or_usn: string;
  otp: string;
  new_password: string;
}) {
  return fetchAPI("/api/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify(payload),
  }) as Promise<ApiMessage>;
}

// ── STUDENTS ─────────────────────────────────────────────────────────────────
export async function apiGetStudents() {
  return fetchAPI("/api/students/");
}

export async function apiGetStudent(usn: string) {
  return fetchAPI(`/api/students/${usn}`);
}

export async function apiAddStudent(data: Record<string, unknown>) {
  return fetchAPI("/api/students/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function apiDeleteStudent(usn: string) {
  return fetchAPI(`/api/students/${usn}`, { method: "DELETE" });
}

export async function apiUpdateStudent(usn: string, data: Record<string, unknown>) {
  return fetchAPI(`/api/students/${usn}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// ── ATTENDANCE ────────────────────────────────────────────────────────────────
export async function apiMarkAttendance(data: {
  usn: string;
  subject_code: string;
  status?: string;
  marked_by?: string;
  date?: string;
}) {
  return fetchAPI("/api/attendance/mark", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function apiMarkBulkAttendance(data: {
  subject_code: string;
  date?: string;
  marked_by?: string;
  records: { usn: string; status: string }[];
}) {
  return fetchAPI("/api/attendance/mark-bulk", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function apiTodayAttendance(subjectCode: string) {
  return fetchAPI(`/api/attendance/today/${subjectCode}`);
}

export async function apiGetTodayDate() {
  return fetchAPI(`/api/attendance/today-date`) as Promise<{ today: string }>;
}

export async function apiGetAttendanceDates(subjectCode: string) {
  return fetchAPI(`/api/attendance/dates/${subjectCode}`) as Promise<{ dates: string[] }>;
}

export async function apiAttendanceByDate(subjectCode: string, date: string) {
  return fetchAPI(`/api/attendance/by-date?subject_code=${encodeURIComponent(subjectCode)}&date=${encodeURIComponent(date)}`) as Promise<{
    usn: string;
    name: string;
    status: string;
    timeMarked: string;
  }[]>;
}

export async function apiStudentAttendance(usn: string) {
  return fetchAPI(`/api/attendance/student/${usn}`);
}

export async function apiAttendanceHistory(usn: string) {
  return fetchAPI(`/api/attendance/history/${usn}`);
}

export async function apiWeeklyAttendance(subjectCode: string) {
  return fetchAPI(`/api/attendance/weekly/${subjectCode}`);
}

export async function apiEditAttendance(data: {
  usn: string;
  subject_code: string;
  date: string;
  status: string;
}) {
  return fetchAPI("/api/attendance/edit", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function apiGetDefaulters(subjectCode: string) {
  return fetchAPI(`/api/attendance/defaulters/${subjectCode}`);
}

// ── MARKS ─────────────────────────────────────────────────────────────────────
export async function apiGetMarks(subjectCode: string) {
  return fetchAPI(`/api/marks/${subjectCode}`);
}

export async function apiGetStudentMarks(usn: string) {
  return fetchAPI(`/api/marks/student/${usn}`) as Promise<{
    subjects: StudentMarkSubject[];
    cgpa: number | null;
    subjectCount: number;
  }>;
}

export interface StudentMarkSubject {
  subjectCode: string;
  subjectName: string;
  cie1: number;
  cie2: number;
  assignment: number;
  totalInternal: number;
  see: number | null;
  totalMarks: number | null;
  grade: string;
  gradePoint: number;
  hasMarks: boolean;
}

export async function apiStudentShortageNotifications(usn: string) {
  return fetchAPI(`/api/notifications/student-shortage/${usn}`) as Promise<{
    notifications: ShortageAlertLogRow[];
  }>;
}

export async function apiSaveMarks(data: {
  subject_code: string;
  records: { usn: string; cie1: number; cie2: number; cie3: number; assignment: number }[];
}) {
  return fetchAPI("/api/marks/save", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function apiMarksStats(subjectCode: string) {
  return fetchAPI(`/api/marks/stats/${subjectCode}`);
}

// ── NOTIFICATIONS ─────────────────────────────────────────────────────────────
export async function apiGetNotifications(userId: string, role: string) {
  return fetchAPI(`/api/notifications/${userId}?role=${role}`);
}

export async function apiMarkNotifRead(id: string) {
  return fetchAPI(`/api/notifications/mark-read/${id}`, { method: "POST" });
}

export async function apiMarkAllRead(userId: string) {
  return fetchAPI("/api/notifications/mark-all-read", {
    method: "POST",
    body: JSON.stringify({ user_id: userId }),
  });
}

export async function apiUnreadCount(userId: string) {
  return fetchAPI(`/api/notifications/unread-count/${userId}`);
}

export interface ShortageAlertLogRow {
  alert_group_id: string;
  timestamp: string;
  student_name: string;
  student_usn: string;
  subject_code: string;
  subject_name: string;
  attendance_pct: number;
  email_status: string | null;
}

export async function apiShortageAlertsLog(limit?: number): Promise<{ alerts: ShortageAlertLogRow[] }> {
  const q = typeof limit === 'number' ? `?limit=${limit}` : '';
  return fetchAPI(`/api/notifications/shortage-alerts-log${q}`);
}

// ── FACE RECOGNITION ──────────────────────────────────────────────────────────
export async function apiRegisterFace(usn: string, imageData: string) {
  return fetchAPI("/api/face/register", {
    method: "POST",
    body: JSON.stringify({ usn, image_data: imageData }),
  });
}

export async function apiRegisterFaceAngles(usn: string, images: string[]) {
  return fetchAPI("/api/face/register", {
    method: "POST",
    body: JSON.stringify({ usn, images }),
  });
}

export interface FaceMatch {
  usn: string;
  name: string;
  confidence: number;
}

export interface RecognizeFaceResponse {
  success: boolean;
  recognized: boolean;
  matched?: boolean;
  usn?: string | null;
  student_name?: string | null;
  confidence?: number;
  faces_in_frame: number;
  matches: FaceMatch[];
  message?: string | null;
  subject_code?: string;
}

export async function apiRecognizeFace(
  imageData: string,
  subjectCode: string,
): Promise<RecognizeFaceResponse> {
  return fetchAPI("/api/face/recognize", {
    method: "POST",
    body: JSON.stringify({ image_data: imageData, subject_code: subjectCode }),
  });
}

export async function apiFaceStatus(usn: string) {
  return fetchAPI(`/api/face/status?usn=${encodeURIComponent(usn)}`) as Promise<{
    registered?: boolean;
    registered_at?: string | null;
    faceRegistered?: boolean;
    face_registered?: boolean;
    hasPhoto?: boolean;
    usn?: string;
  }>;
}

export async function apiFaceHealth() {
  return fetchAPI("/api/face/health");
}

// ── REPORTS & TIMETABLE ───────────────────────────────────────────────────────
export async function apiDailyReport(subjectCode: string, date: string) {
  return fetchAPI(`/api/reports/daily?subject_code=${subjectCode}&date=${date}`);
}

export async function apiMonthlyReport(subjectCode: string, year: number, month: number) {
  return fetchAPI(`/api/reports/monthly?subject_code=${subjectCode}&year=${year}&month=${month}`);
}

export async function apiGetTimetable() {
  return fetchAPI("/api/reports/timetable");
}

export interface SubjectOption {
  code: string;
  name: string;
  shortName?: string;
  contactHours?: number;
  color?: string;
  teacher_id?: string;
}

export async function apiGetSubjects() {
  return fetchAPI("/api/reports/subjects") as Promise<SubjectOption[]>;
}

// ── ADMIN ─────────────────────────────────────────────────────────────────────
export type TeacherAnalytics = {
  subject_code: string;
  subject_name: string;
  students: { usn: string; name: string; present: number; total: number; percentage: number }[];
  weekly: { week: string; average: number }[];
  ratio: { name: string; value: number }[];
  summary: {
    totalStudents: number;
    averageAttendance: number;
    below75: number;
    above90: number;
  };
};

export async function apiTeacherAnalytics(subjectCode: string) {
  return fetchAPI(`/api/analytics/teacher/${encodeURIComponent(subjectCode)}`) as Promise<TeacherAnalytics>;
}

export type StudentAnalytics = {
  usn: string;
  subjects: {
    subjectCode: string;
    subjectName: string;
    present: number;
    totalClasses: number;
    percentage: number;
  }[];
  weekly: {
    subjectCode: string;
    subjectName: string;
    week: string;
    percentage: number;
  }[];
  predictions: {
    subjectCode: string;
    subjectName: string;
    needed: number;
    percentage: number;
  }[];
};

export async function apiStudentAnalytics(usn: string) {
  return fetchAPI(`/api/analytics/student/${encodeURIComponent(usn)}`) as Promise<StudentAnalytics>;
}

export type AttendancePrediction = {
  current_pct: number;
  status: "below_75" | "caution" | "safe" | "no_data";
  classes_needed?: number;
  classes_can_miss?: number;
  message: string;
};

export async function apiAttendancePrediction(usn: string, subjectCode: string) {
  return fetchAPI(`/api/analytics/prediction/${encodeURIComponent(usn)}/${encodeURIComponent(subjectCode)}`) as Promise<AttendancePrediction>;
}

export type TodayClass = {
  id?: string;
  time: string;
  time_slot?: string;
  subject_code?: string;
  subject_name: string;
  section?: string;
  section_id?: string;
  section_name?: string;
  room: string;
  room_number?: string;
  is_holiday?: boolean;
  holiday_reason?: string;
};

export interface TimetableEntry {
  id: string;
  time?: string;
  day: string;
  time_slot: string;
  subject_code?: string;
  subject_name: string;
  teacher_id: string;
  teacher_name: string;
  room?: string;
  room_number: string;
  section?: string;
  section_id: string;
  section_name: string;
  is_holiday?: boolean;
  holiday_reason?: string;
  created_at?: string;
  updated_at?: string;
}

export type TimetableDays = Record<string, TimetableEntry[]>;

export interface TimetableSection {
  id: string;
  section_id: string;
  section_name: string;
  semester?: string | number;
  label: string;
}

export type TimetableEntryPayload = {
  section_id: string;
  section_name: string;
  day: string;
  time_slot: string;
  subject_name: string;
  teacher_id: string;
  teacher_name: string;
  room_number: string;
  is_holiday?: boolean;
  holiday_reason?: string;
};

export async function apiTimetableSections() {
  return fetchAPI("/api/timetable/sections") as Promise<{
    success: boolean;
    sections: TimetableSection[];
  }>;
}

export async function apiAddTimetableEntry(data: TimetableEntryPayload) {
  return fetchAPI("/api/timetable/entry", {
    method: "POST",
    body: JSON.stringify(data),
  }) as Promise<{ success: boolean; entry: TimetableEntry }>;
}

export async function apiUpdateTimetableEntry(entryId: string, data: Partial<TimetableEntryPayload> & { is_holiday?: boolean; holiday_reason?: string }) {
  return fetchAPI(`/api/timetable/entry/${encodeURIComponent(entryId)}`, {
    method: "PUT",
    body: JSON.stringify(data),
  }) as Promise<{ success: boolean; entry: TimetableEntry }>;
}

export async function apiDeleteTimetableEntry(entryId: string) {
  return fetchAPI(`/api/timetable/entry/${encodeURIComponent(entryId)}`, { method: "DELETE" });
}

export async function apiGetSectionTimetable(sectionId: string) {
  return fetchAPI(`/api/timetable/section/${encodeURIComponent(sectionId)}`) as Promise<{
    success: boolean;
    section_id?: string;
    days: TimetableDays;
    entries: TimetableEntry[];
  }>;
}

export async function apiGetTeacherTimetable(teacherId: string) {
  return fetchAPI(`/api/timetable/teacher/${encodeURIComponent(teacherId)}`) as Promise<{
    success: boolean;
    teacher_id: string;
    days: TimetableDays;
    entries: TimetableEntry[];
  }>;
}

export async function apiMarkTimetableHoliday(entryId: string, reason?: string) {
  return fetchAPI(`/api/timetable/holiday/${encodeURIComponent(entryId)}`, {
    method: "PUT",
    body: JSON.stringify({ reason: reason ?? "" }),
  }) as Promise<{ success: boolean; entry: TimetableEntry }>;
}

export async function apiGetAllTimetable(sectionId: string) {
  return apiGetSectionTimetable(sectionId);
}

export async function apiTodaySchedule(teacherId: string) {
  const res = await apiGetTeacherTimetable(teacherId);
  const today = new Date().toLocaleDateString("en-US", { weekday: "long" });
  return {
    day: today,
    classes: (res.entries ?? []).filter((entry) => entry.day === today).map((entry) => ({
      ...entry,
      time: entry.time_slot,
      room: entry.room_number || entry.room || "",
      section: entry.section_name || entry.section || "",
    })),
  } as { day: string; classes: TimetableEntry[] };
}

export async function apiStudentTimetable(sectionId: string) {
  const res = await apiGetSectionTimetable(sectionId);
  const today = new Date().toLocaleDateString("en-US", { weekday: "long" });
  return {
    success: res.success,
    section: sectionId,
    day: today,
    classes: (res.entries ?? []).filter((entry) => entry.day === today),
    days: res.days,
    entries: res.entries,
  } as {
    success: boolean;
    section: string;
    day: string;
    classes: TimetableEntry[];
    days: TimetableDays;
    entries: TimetableEntry[];
  };
}

export function apiExportUrl(path: string) {
  if (!API_BASE) return path;
  return `${API_BASE}${path}`;
}

export async function apiPublicStats() {
  return fetchAPI("/api/admin/stats") as Promise<{
    teachers: number;
    students: number;
    subjects: number;
  }>;
}

export async function apiAdminDashboard() {
  return fetchAPI("/api/admin/dashboard") as Promise<{
    teachers: number;
    students: number;
    recentActivity: { id: string; type: string; message: string; timestamp: string }[];
  }>;
}

export interface AdminTeacher {
  teacher_id: string;
  name: string;
  email: string;
  subject_code: string;
  subject_name: string;
  department: string;
  semester: string;
  section: string;
  assignments?: {
    semester: string;
    section: string;
    subject_code: string;
    subject_name: string;
    department: string;
  }[];
}

export interface AdminStudent {
  usn: string;
  name: string;
  email: string;
  phone: string;
  branch: string;
  semester: string;
  section: string;
  face_registered?: boolean;
}

export interface AdminSection {
  id: string;
  semester: number | string;
  section_name: string;
  created_at?: string;
  student_count: number;
  teacher_count: number;
  is_empty: boolean;
}

export interface AdminSemesterSummary {
  semester: number;
  sections: number;
  students: number;
}

function adminScopeQuery(scope?: { semester?: string | number; section?: string }) {
  const params = new URLSearchParams();
  if (scope?.semester) params.set("semester", String(scope.semester));
  if (scope?.section) params.set("section", scope.section);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export async function apiAdminSemesterSummary() {
  return fetchAPI("/api/admin/semesters-summary") as Promise<AdminSemesterSummary[]>;
}

export async function apiAdminGetSections(semester?: string | number) {
  const qs = semester ? `?semester=${encodeURIComponent(String(semester))}` : "";
  return fetchAPI(`/api/admin/sections${qs}`) as Promise<AdminSection[]>;
}

export async function apiAdminGetStudentSections() {
  return fetchAPI("/api/admin/sections") as Promise<string[]>;
}

export async function apiAdminAddSection(data: { semester: string | number; section_name: string }) {
  return fetchAPI("/api/admin/sections", {
    method: "POST",
    body: JSON.stringify(data),
  }) as Promise<{ success: boolean; section: AdminSection; message?: string }>;
}

export async function apiAdminDeleteSection(semester: string | number, sectionName: string) {
  return fetchAPI(
    `/api/admin/sections/${encodeURIComponent(String(semester))}/${encodeURIComponent(sectionName)}`,
    { method: "DELETE" },
  );
}

export async function apiAdminGetTeachers(scope?: { semester?: string | number; section?: string }) {
  return fetchAPI(`/api/admin/teachers${adminScopeQuery(scope)}`) as Promise<AdminTeacher[]>;
}

export async function apiAdminGetStudents(scope?: { semester?: string | number; section?: string }) {
  return fetchAPI(`/api/admin/students${adminScopeQuery(scope)}`) as Promise<AdminStudent[]>;
}

export async function apiAdminAddTeacher(data: Record<string, string>) {
  return fetchAPI("/api/admin/teachers", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function apiAdminAddStudent(data: Record<string, unknown>) {
  return fetchAPI("/api/admin/students", {
    method: "POST",
    body: JSON.stringify(data),
  }) as Promise<{
    success: boolean;
    usn: string;
    face_registered?: boolean;
    face_message?: string;
  }>;
}

export async function apiAdminEditStudent(usn: string, data: Record<string, unknown>) {
  return fetchAPI(`/api/admin/edit-student/${usn}`, {
    method: "PUT",
    body: JSON.stringify(data),
  }) as Promise<{
    success: boolean;
    face_registered?: boolean;
    face_message?: string;
  }>;
}

export async function apiAdminDeleteTeacher(teacherId: string) {
  return fetchAPI(`/api/admin/delete-teacher/${teacherId}`, { method: "DELETE" });
}

export async function apiAdminDeleteStudent(usn: string) {
  return fetchAPI(`/api/admin/delete-student/${usn}`, { method: "DELETE" });
}

export async function apiAdminEditTeacher(teacherId: string, data: Record<string, string>) {
  return fetchAPI(`/api/admin/edit-teacher/${teacherId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// ── ACTIVITY LOG ──────────────────────────────────────────────────────────────
export interface ActivityLogEntry {
  id: string;
  action_type: "teacher_added" | "teacher_edited" | "teacher_deleted" | "student_added" | "student_edited" | "student_deleted";
  performed_by: string;
  target_name: string;
  target_id: string;
  timestamp: string;
  details: string;
}

export async function apiAdminActivityLog(limit: number = 50) {
  return fetchAPI(`/api/admin/activity-log?limit=${limit}`) as Promise<{
    success: boolean;
    logs: ActivityLogEntry[];
  }>;
}

// ── CONDONATION ───────────────────────────────────────────────────────────────
export interface CondonationRequest {
  id: string;
  usn: string;
  student_name?: string;
  subject_code: string;
  subject_name?: string;
  reason: string;
  supporting_details: string;
  status: "pending" | "approved" | "rejected";
  timestamp: string;
  date_submitted?: string;
  teacher_remarks: string;
  document_urls?: string[];
}

export async function apiCreateCondonationRequest(data: {
  usn: string;
  subject_code: string;
  reason: string;
  supporting_details: string;
  document_urls?: string[];
}) {
  return fetchAPI("/api/condonation/request", {
    method: "POST",
    body: JSON.stringify(data),
  }) as Promise<{
    success: boolean;
    request_id: string;
    message: string;
  }>;
}

export async function apiUploadCondonationDocument(data: {
  usn: string;
  subject_code: string;
  file: File;
}) {
  if (!API_BASE) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured");
  }
  const formData = new FormData();
  formData.append("file", data.file);
  formData.append("usn", data.usn);
  formData.append("subject_code", data.subject_code);

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api/condonation/upload-document`, {
      method: "POST",
      body: formData,
    });
  } catch {
    throw new ApiRequestError("Cannot connect to server. Make sure backend is running.", {
      isNetworkError: true,
    });
  }

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiRequestError(json.message || json.error || `API error ${res.status}`, {
      status: res.status,
    });
  }
  return json as Promise<{ success: boolean; url: string; filename: string; content_type: string }>;
}

export async function apiGetStudentCondonationRequests(usn: string) {
  return fetchAPI(`/api/condonation/student/${encodeURIComponent(usn)}`) as Promise<{
    success: boolean;
    requests: CondonationRequest[];
  }>;
}

export async function apiGetTeacherCondonationRequests(subjectCode: string) {
  return fetchAPI(`/api/condonation/teacher/${encodeURIComponent(subjectCode)}`) as Promise<{
    success: boolean;
    requests: CondonationRequest[];
  }>;
}

export async function apiRespondToCondonation(requestId: string, status: "approved" | "rejected", remarks: string) {
  return fetchAPI(`/api/condonation/respond/${requestId}`, {
    method: "PUT",
    body: JSON.stringify({ status, teacher_remarks: remarks }),
  }) as Promise<{
    success: boolean;
    message: string;
  }>;
}
