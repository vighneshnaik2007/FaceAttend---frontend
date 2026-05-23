'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ChevronRight, Eye, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AdminSection,
  apiAdminAddSection,
  apiAdminDeleteSection,
  apiAdminGetSections,
} from '@/lib/api';
import { semesterLabel } from '@/lib/admin-semesters';

export default function AdminSemesterSectionsPage() {
  const params = useParams();
  const router = useRouter();
  const semester = String(params.id || '');
  const [sections, setSections] = useState<AdminSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [sectionName, setSectionName] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    if (!semester) return;
    setLoading(true);
    apiAdminGetSections(semester)
      .then(setSections)
      .catch((e) => toast.error(e instanceof Error ? e.message : 'Could not load sections'))
      .finally(() => setLoading(false));
  }, [semester]);

  useEffect(() => {
    load();
  }, [load]);

  const addSection = async () => {
    const name = sectionName.trim().toUpperCase();
    if (!name) {
      toast.error('Enter a section name');
      return;
    }
    if (sections.some((section) => section.section_name.toUpperCase() === name)) {
      toast.error('Section already exists in this semester');
      return;
    }

    setSaving(true);
    try {
      const res = await apiAdminAddSection({ semester, section_name: name });
      setSections((current) => [...current, res.section].sort((a, b) => a.section_name.localeCompare(b.section_name)));
      setSectionName('');
      setOpen(false);
      toast.success('Section added');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not add section');
    } finally {
      setSaving(false);
    }
  };

  const deleteSection = async (section: AdminSection) => {
    if (!section.is_empty) return;
    if (!confirm(`Delete Section ${section.section_name}?`)) return;

    try {
      await apiAdminDeleteSection(semester, section.section_name);
      setSections((current) => current.filter((item) => item.id !== section.id));
      toast.success('Section deleted');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not delete section');
    }
  };

  return (
    <main className="p-4 sm:p-8">
      <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <Link href="/admin/dashboard" className="hover:text-blue-600 dark:hover:text-blue-300">Admin</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="font-medium text-slate-900 dark:text-slate-100">{semesterLabel(semester)}</span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <Button variant="ghost" className="mb-3 -ml-3 min-h-11" onClick={() => router.push('/admin/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{semesterLabel(semester)} - Sections</h1>
          <p className="text-slate-500 dark:text-slate-400">Create and open sections for this semester.</p>
        </div>
        <Button onClick={() => setOpen(true)} className="min-h-11 bg-[#2563EB] hover:bg-[#1D4ED8]">
          <Plus className="w-4 h-4 mr-2" />
          Add Section
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-56 rounded-lg" />
          ))}
        </div>
      ) : sections.length === 0 ? (
        <Card className="card-shadow dark:border-slate-800 dark:bg-slate-950">
          <CardContent className="p-8 text-center text-slate-500 dark:text-slate-400">
            No sections yet. Add your first section.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {sections.map((section) => (
            <Card key={section.id} className="card-shadow dark:border-slate-800 dark:bg-slate-950">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Section</p>
                    <h2 className="text-3xl font-bold text-slate-950 dark:text-slate-100">{section.section_name}</h2>
                  </div>
                  <Button
                    size="icon"
                    variant="outline"
                    className="min-h-11 min-w-11 text-red-600 disabled:text-slate-400"
                    disabled={!section.is_empty}
                    onClick={() => deleteSection(section)}
                    title={section.is_empty ? 'Delete section' : 'Only empty sections can be deleted'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900">
                    <p className="text-slate-500 dark:text-slate-400">Students</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{section.student_count}</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900">
                    <p className="text-slate-500 dark:text-slate-400">Teachers</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{section.teacher_count}</p>
                  </div>
                </div>
                <Button asChild className="mt-5 min-h-11 w-full bg-[#0F172A] hover:bg-[#1E293B]">
                  <Link href={`/admin/semester/${semester}/section/${encodeURIComponent(section.id)}`}>
                    <Eye className="w-4 h-4 mr-2" />
                    View
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Section</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Section Name</Label>
              <Input
                value={sectionName}
                onChange={(e) => setSectionName(e.target.value.toUpperCase())}
                placeholder="A"
              />
            </div>
            <Button onClick={addSection} disabled={saving} className="min-h-11 w-full bg-[#2563EB] hover:bg-[#1D4ED8]">
              {saving ? 'Saving...' : 'Create Section'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
