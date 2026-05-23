'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { TeacherHeader } from '@/components/teacher/header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Grid3X3, List, Plus, Eye, Pencil, Star, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';
import { apiGetStudents, apiTodayAttendance } from '@/lib/api';

type StudentRow = {
  id: string;
  name: string;
  usn: string;
  email: string;
  cgpa?: number;
  faceRegistered?: boolean;
};

export default function StudentsPage() {
  const { user } = useAuth();
  const subject = user?.assignedSubject;
  const subjectCode = subject?.code ?? user?.subject_code ?? '';
  
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [pctByUsn, setPctByUsn] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (!subjectCode) return;
    setLoading(true);
    Promise.all([apiGetStudents(), apiTodayAttendance(subjectCode)])
      .then(([list, today]) => {
        setStudents(list);
        const map: Record<string, number> = {};
        for (const r of today.records || []) {
          map[r.usn] = r.attendance_pct ?? 0;
        }
        setPctByUsn(map);
      })
      .catch(() => setStudents([]))
      .finally(() => setLoading(false));
  }, [subjectCode]);

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         student.usn.toLowerCase().includes(searchQuery.toLowerCase());
    const subjectPct = pctByUsn[student.usn] ?? 0;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'safe' && subjectPct >= 75) ||
                         (statusFilter === 'warning' && subjectPct >= 60 && subjectPct < 75) ||
                         (statusFilter === 'danger' && subjectPct < 60);
    return matchesSearch && matchesStatus;
  });

  const getAttendanceColor = (attendance: number) => {
    if (attendance >= 75) return { ring: 'stroke-[#10B981]', text: 'text-[#10B981]', bg: 'bg-[#10B981]' };
    if (attendance >= 60) return { ring: 'stroke-[#F59E0B]', text: 'text-[#F59E0B]', bg: 'bg-[#F59E0B]' };
    return { ring: 'stroke-[#EF4444]', text: 'text-[#EF4444]', bg: 'bg-[#EF4444]' };
  };

  return (
    <div className="min-h-screen">
      <TeacherHeader title={subjectCode ? `${subjectCode} Students` : 'Students'} />
      
      <main className="p-4 sm:p-6">
        {/* Subject Info Banner */}
        <Card className="card-shadow mb-6 border-l-4 border-l-[#2563EB]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-[#1E293B]">
                  My Students — {subjectCode || '—'}
                  {students.length > 0 ? ` (${students.length})` : ''}
                </h2>
                <p className="text-sm text-[#64748B] mt-1">{subject?.name}</p>
              </div>
              <Badge className="bg-[#2563EB]/20 text-[#2563EB] border-[#2563EB]/30 border">
                🔒 {subject?.code} Only
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Top Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
              <Input
                placeholder="Search by name or USN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-64"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="safe">Safe ({'>'}75%)</SelectItem>
                <SelectItem value="warning">Warning (60-75%)</SelectItem>
                <SelectItem value="danger">Danger ({'<'}60%)</SelectItem>
              </SelectContent>
            </Select>

            {/* View Toggle */}
            <div className="flex rounded-lg border border-[#E2E8F0] p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'min-h-11 min-w-11 px-3 py-2 rounded transition-all',
                  viewMode === 'grid' 
                    ? 'bg-[#2563EB] text-white' 
                    : 'text-[#64748B] hover:text-[#1E293B]'
                )}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'min-h-11 min-w-11 px-3 py-2 rounded transition-all',
                  viewMode === 'list' 
                    ? 'bg-[#2563EB] text-white' 
                    : 'text-[#64748B] hover:text-[#1E293B]'
                )}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {loading && <p className="text-[#64748B] mb-4">Loading students…</p>}
        {!loading && students.length === 0 && (
          <p className="text-[#64748B] mb-4">No students in the system. Ask admin to add students.</p>
        )}

        {/* Students Grid */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredStudents.map((student) => {
              const subjectPct = pctByUsn[student.usn] ?? 0;
              const shortage = subjectPct < 75;
              const colors = getAttendanceColor(subjectPct);
              const radius = 45;
              const circumference = 2 * Math.PI * radius;
              const offset = circumference - (subjectPct / 100) * circumference;

              return (
                <Link key={student.id} href={`/teacher/students/${student.id}`}>
                  <Card className={cn(
                    'card-shadow hover:shadow-lg transition-all hover:scale-105 cursor-pointer h-full',
                    shortage && 'border-2 border-red-500 ring-2 ring-red-200 bg-red-50/40',
                  )}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="font-bold text-[#1E293B] text-sm flex items-center gap-2">
                            {shortage && <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />}
                            {student.name}
                          </h3>
                          <p className="text-xs text-[#64748B]">{student.usn}</p>
                          {shortage && (
                            <p className="text-xs font-semibold text-red-700 mt-1">{subjectPct}% — below 75%</p>
                          )}
                        </div>
                        <Star className="w-4 h-4 text-[#F59E0B]" />
                      </div>

                      {/* Circular Progress */}
                      <div className="flex justify-center mb-4">
                        <svg width="120" height="120">
                          <circle cx="60" cy="60" r={radius} fill="none" stroke="#E2E8F0" strokeWidth="8" />
                          <circle
                            cx="60"
                            cy="60"
                            r={radius}
                            fill="none"
                            stroke={colors.bg}
                            strokeWidth="8"
                            strokeDasharray={circumference}
                            strokeDashoffset={offset}
                            strokeLinecap="round"
                            style={{ transition: 'stroke-dashoffset 0.35s', transform: 'rotate(-90deg)', transformOrigin: '60px 60px' }}
                          />
                          <text
                            x="60"
                            y="60"
                            textAnchor="middle"
                            dominantBaseline="middle"
                            className="text-2xl font-bold"
                            fill={colors.bg}
                          >
                            {subjectPct}%
                          </text>
                        </svg>
                      </div>

                      {/* Attendance Label */}
                      <p className="text-xs text-[#64748B] text-center font-medium mb-3">{subject?.code} Attendance</p>

                      {/* CGPA & Email */}
                      <div className="space-y-1 text-xs mb-4">
                        <div className="flex items-center justify-between">
                          <span className="text-[#64748B]">CGPA:</span>
                          <span className="font-bold text-[#1E293B]">{student.cgpa ?? '—'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[#64748B]">Email:</span>
                          <span className="font-mono text-[#2563EB] truncate">{student.email}</span>
                        </div>
                      </div>

                      {/* Action Button */}
                      <Button className="w-full min-h-11 bg-[#2563EB] hover:bg-[#1D4ED8] text-white h-11 rounded-lg text-xs flex items-center justify-center gap-1">
                        <Eye className="w-3 h-3" />
                        View Profile
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}

        {/* Students List */}
        {viewMode === 'list' && (
          <div className="space-y-2">
            {filteredStudents.map((student, idx) => {
              const subjectPct = pctByUsn[student.usn] ?? 0;
              const shortage = subjectPct < 75;
              const colors = getAttendanceColor(subjectPct);

              return (
                <Link key={student.id} href={`/teacher/students/${student.id}`}>
                  <Card className={cn(
                    'card-shadow hover:shadow-md transition-all cursor-pointer',
                    shortage && 'border-2 border-red-500 bg-red-50/50',
                  )}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        {/* Index */}
                        <span className="text-sm font-bold text-[#64748B] w-8">{idx + 1}</span>

                        {/* Student Info */}
                        <div className="flex-1">
                          <h3 className="font-semibold text-[#1E293B] text-sm flex items-center gap-2">
                            {shortage && <AlertTriangle className="w-4 h-4 text-red-600" />}
                            {student.name}
                          </h3>
                          <p className="text-xs text-[#64748B]">{student.usn}</p>
                          {shortage && (
                            <p className="text-xs text-red-700 font-semibold mt-0.5">{subjectPct}% in {subjectCode}</p>
                          )}
                        </div>

                        {/* Attendance */}
                        <div className="flex items-center gap-2">
                          <div className="text-center">
                            <p className={`text-sm font-bold ${colors.text}`}>{subjectPct}%</p>
                            <p className="text-xs text-[#64748B]">{subject?.code}</p>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <Badge className={cn(
                          'rounded-full',
                          subjectPct >= 75 
                            ? 'bg-[#10B981]/20 text-[#10B981] border-[#10B981]/30' 
                            : subjectPct >= 60
                            ? 'bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B]/30'
                            : 'bg-[#EF4444]/20 text-[#EF4444] border-[#EF4444]/30'
                        )}>
                          {subjectPct >= 75 ? '✓ Safe' : subjectPct >= 60 ? '⚠ Warning' : '✗ Danger'}
                        </Badge>

                        {/* CGPA */}
                        <div className="text-right">
                          <p className="text-xs text-[#64748B]">CGPA</p>
                          <p className="text-sm font-bold text-[#1E293B]">{student.cgpa}</p>
                        </div>

                        {/* Action Button */}
                        <Button size="sm" variant="outline" className="rounded-lg">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
