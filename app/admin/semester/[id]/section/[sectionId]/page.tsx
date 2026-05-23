'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ChevronRight, Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AdminSection,
  AdminStudent,
  AdminTeacher,
  apiAdminAddTeacher,
  apiAdminDeleteStudent,
  apiAdminDeleteTeacher,
  apiAdminEditStudent,
  apiAdminGetSections,
  apiAdminGetStudents,
  apiAdminGetTeachers,
} from '@/lib/api';
import { semesterLabel } from '@/lib/admin-semesters';

export default function AdminSectionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const semester = String(params.id || '');
  const sectionId = decodeURIComponent(String(params.sectionId || ''));
  const [sectionName, setSectionName] = useState('');
  const [students, setStudents] = useState<AdminStudent[]>([]);
  const [teachers, setTeachers] = useState<AdminTeacher[]>([]);
  const [allStudents, setAllStudents] = useState<AdminStudent[]>([]);
  const [allTeachers, setAllTeachers] = useState<AdminTeacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentOpen, setStudentOpen] = useState(false);
  const [teacherOpen, setTeacherOpen] = useState(false);
  const [selectedUsn, setSelectedUsn] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [saving, setSaving] = useState(false);

  const resolveSection = useCallback(async () => {
    if (!semester || !sectionId) return '';
    const rows = await apiAdminGetSections(semester);
    const match = rows.find((section: AdminSection) => section.id === sectionId || section.section_name.toUpperCase() === sectionId.toUpperCase());
    const name = match?.section_name || sectionId.toUpperCase();
    setSectionName(name);
    return name;
  }, [semester, sectionId]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const name = sectionName || await resolveSection();
      if (!semester || !name) return;
      const [studentRows, teacherRows, globalStudents, globalTeachers] = await Promise.all([
        apiAdminGetStudents({ semester, section: name }),
        apiAdminGetTeachers({ semester, section: name }),
        apiAdminGetStudents(),
        apiAdminGetTeachers(),
      ]);
      setStudents(studentRows);
      setTeachers(teacherRows);
      setAllStudents(globalStudents);
      setAllTeachers(globalTeachers);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not load section');
    } finally {
      setLoading(false);
    }
  }, [resolveSection, sectionName, semester]);

  useEffect(() => {
    load();
  }, [load]);

  const studentOptions = useMemo(
    () => allStudents.filter((student) => !students.some((current) => current.usn === student.usn)),
    [allStudents, students],
  );
  const teacherOptions = useMemo(
    () => allTeachers.filter((teacher) => !teachers.some((current) => current.teacher_id === teacher.teacher_id)),
    [allTeachers, teachers],
  );

  const addStudent = async () => {
    if (!selectedUsn || !sectionName) {
      toast.error('Select a student');
      return;
    }
    setSaving(true);
    try {
      await apiAdminEditStudent(selectedUsn, { semester, section: sectionName });
      toast.success('Student assigned to section');
      setStudentOpen(false);
      setSelectedUsn('');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not assign student');
    } finally {
      setSaving(false);
    }
  };

  const addTeacher = async () => {
    const teacher = allTeachers.find((item) => item.teacher_id === selectedTeacherId);
    if (!teacher || !sectionName) {
      toast.error('Select a teacher');
      return;
    }
    setSaving(true);
    try {
      const res = await apiAdminAddTeacher({
        teacher_id: teacher.teacher_id,
        name: teacher.name,
        email: teacher.email,
        subject_code: teacher.subject_code || teacher.assignments?.[0]?.subject_code || '',
        subject_name: teacher.subject_name || teacher.assignments?.[0]?.subject_name || '',
        department: teacher.department || teacher.assignments?.[0]?.department || '',
        semester,
        section: sectionName,
      });
      toast.success((res as { existing?: boolean }).existing ? 'Teacher assigned to section' : 'Teacher added');
      setTeacherOpen(false);
      setSelectedTeacherId('');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not assign teacher');
    } finally {
      setSaving(false);
    }
  };

  const deleteStudent = async (usn: string) => {
    if (!window.confirm('Delete this student account and all related records?')) return;
    try {
      await apiAdminDeleteStudent(usn);
      toast.success('Student deleted');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Delete failed');
    }
  };

  const deleteTeacher = async (teacherId: string) => {
    if (!window.confirm('Delete this teacher account?')) return;
    try {
      await apiAdminDeleteTeacher(teacherId);
      toast.success('Teacher deleted');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Delete failed');
    }
  };

  const title = `Section ${sectionName || sectionId} - ${semesterLabel(semester)}`;

  return (
    <main className="p-4 sm:p-8">
      <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <Link href="/admin/dashboard" className="hover:text-blue-600 dark:hover:text-blue-300">Admin</Link>
        <ChevronRight className="w-4 h-4" />
        <Link href={`/admin/semester/${semester}`} className="hover:text-blue-600 dark:hover:text-blue-300">
          {semesterLabel(semester)}
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="font-medium text-slate-900 dark:text-slate-100">Section {sectionName || sectionId}</span>
      </div>

      <div className="mb-8">
        <Button variant="ghost" className="mb-3 -ml-3 min-h-11" onClick={() => router.push(`/admin/semester/${semester}`)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{title}</h1>
        <p className="text-slate-500 dark:text-slate-400">Manage teachers and students assigned to this section.</p>
      </div>

      <Tabs defaultValue="teachers">
        <TabsList className="mb-6">
          <TabsTrigger value="teachers">Teachers</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
        </TabsList>

        <TabsContent value="teachers">
          <Card className="card-shadow dark:border-slate-800 dark:bg-slate-950">
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <CardTitle className="text-lg dark:text-slate-100">Teachers</CardTitle>
              <Button onClick={() => setTeacherOpen(true)} className="min-h-11 bg-[#2563EB] hover:bg-[#1D4ED8]">
                <Plus className="w-4 h-4 mr-2" />
                Add Teacher
              </Button>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {loading ? <TableSkeleton /> : teachers.length === 0 ? (
                <p className="text-slate-500 dark:text-slate-400">No teachers assigned to this section.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-slate-500 dark:border-slate-800 dark:text-slate-400">
                      <th className="py-3 pr-4">Name</th>
                      <th className="py-3 pr-4">Teacher ID</th>
                      <th className="py-3 pr-4">Subjects</th>
                      <th className="py-3 pr-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teachers.map((teacher) => (
                      <tr key={`${teacher.teacher_id}-${teacher.subject_code}-${teacher.section}`} className="border-b border-slate-200/80 dark:border-slate-800">
                        <td className="py-3 font-medium dark:text-slate-100">{teacher.name}</td>
                        <td className="py-3 font-mono text-xs dark:text-slate-200">{teacher.teacher_id}</td>
                        <td className="py-3 dark:text-slate-200">{teacher.subject_code}{teacher.subject_name ? ` - ${teacher.subject_name}` : ''}</td>
                        <td className="py-3">
                          <Button size="icon" variant="outline" className="min-h-11 min-w-11 text-red-600" onClick={() => deleteTeacher(teacher.teacher_id)} aria-label="Delete teacher">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students">
          <Card className="card-shadow dark:border-slate-800 dark:bg-slate-950">
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <CardTitle className="text-lg dark:text-slate-100">Students</CardTitle>
              <Button onClick={() => setStudentOpen(true)} className="min-h-11 bg-[#7C3AED] hover:bg-[#6D28D9]">
                <Plus className="w-4 h-4 mr-2" />
                Add Student
              </Button>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {loading ? <TableSkeleton /> : students.length === 0 ? (
                <p className="text-slate-500 dark:text-slate-400">No students assigned to this section.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-slate-500 dark:border-slate-800 dark:text-slate-400">
                      <th className="py-3 pr-4">Name</th>
                      <th className="py-3 pr-4">USN</th>
                      <th className="py-3 pr-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => (
                      <tr key={student.usn} className="border-b border-slate-200/80 dark:border-slate-800">
                        <td className="py-3 font-medium dark:text-slate-100">{student.name}</td>
                        <td className="py-3 font-mono text-xs dark:text-slate-200">{student.usn}</td>
                        <td className="py-3">
                          <Button size="icon" variant="outline" className="min-h-11 min-w-11 text-red-600" onClick={() => deleteStudent(student.usn)} aria-label="Delete student">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={teacherOpen} onOpenChange={setTeacherOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add Teacher</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label>Teacher</Label>
            <Select value={selectedTeacherId || undefined} onValueChange={setSelectedTeacherId}>
              <SelectTrigger className="min-h-11"><SelectValue placeholder="Select teacher" /></SelectTrigger>
              <SelectContent>
                {teacherOptions.map((teacher) => (
                  <SelectItem key={teacher.teacher_id} value={teacher.teacher_id}>
                    {teacher.name} - {teacher.teacher_id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" className="min-h-11" onClick={() => setTeacherOpen(false)}>Cancel</Button>
            <Button className="min-h-11" onClick={addTeacher} disabled={saving || !selectedTeacherId}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Teacher
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={studentOpen} onOpenChange={setStudentOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add Student</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label>Student</Label>
            <Select value={selectedUsn || undefined} onValueChange={setSelectedUsn}>
              <SelectTrigger className="min-h-11"><SelectValue placeholder="Select student" /></SelectTrigger>
              <SelectContent>
                {studentOptions.map((student) => (
                  <SelectItem key={student.usn} value={student.usn}>
                    {student.name} - {student.usn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" className="min-h-11" onClick={() => setStudentOpen(false)}>Cancel</Button>
            <Button className="min-h-11" onClick={addStudent} disabled={saving || !selectedUsn}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Student
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={index} className="h-12 rounded-lg" />
      ))}
    </div>
  );
}
