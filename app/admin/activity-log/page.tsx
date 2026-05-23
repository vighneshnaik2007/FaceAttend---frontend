'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Plus, Trash2, Pencil, RefreshCw } from 'lucide-react';
import { apiAdminActivityLog, ActivityLogEntry } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useMinimumLoading } from '@/hooks/use-minimum-loading';

function formatTimestamp(isoString: string): string {
  try {
    const date = new Date(isoString);
    const day = date.toLocaleString('en-GB', { day: '2-digit' });
    const month = date.toLocaleString('en-GB', { month: 'short' });
    const year = date.toLocaleString('en-GB', { year: 'numeric' });
    const time = date.toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    return `${day} ${month} ${year} at ${time}`;
  } catch {
    return isoString;
  }
}

function getActionIcon(actionType: string) {
  switch (actionType) {
    case 'teacher_added':
    case 'student_added':
      return <Plus className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
    case 'teacher_deleted':
    case 'student_deleted':
      return <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />;
    case 'teacher_edited':
    case 'student_edited':
      return <Pencil className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
    default:
      return <AlertTriangle className="w-5 h-5 text-gray-600 dark:text-gray-300" />;
  }
}

function getActionBadge(actionType: string) {
  switch (actionType) {
    case 'teacher_added':
    case 'student_added':
      return <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">Added</Badge>;
    case 'teacher_deleted':
    case 'student_deleted':
      return <Badge className="bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200">Deleted</Badge>;
    case 'teacher_edited':
    case 'student_edited':
      return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200">Edited</Badge>;
    default:
      return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100">Action</Badge>;
  }
}

function buildDescription(log: ActivityLogEntry) {
  if (log.details) return log.details;
  const target = log.action_type.startsWith('teacher') ? 'teacher' : 'student';
  const action = log.action_type.endsWith('added')
    ? 'added'
    : log.action_type.endsWith('deleted')
      ? 'deleted'
      : 'edited';
  return `Admin ${action} ${target} ${log.target_name} (${log.target_id})`;
}

function SkeletonLoader() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="flex gap-4 p-4 border rounded-lg">
          <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
      ))}
    </div>
  );
}

export default function ActivityLogPage() {
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [visibleCount, setVisibleCount] = useState(20);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const showSkeleton = useMinimumLoading(loading);

  const loadLogs = async () => {
    try {
      const data = await apiAdminActivityLog(50);
      const sortedLogs = [...(data.logs || [])].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );
      setLogs(sortedLogs);
      setVisibleCount(20);
    } catch (error) {
      console.error('Failed to load activity logs:', error);
      setLogs([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadLogs();
  };

  const visibleLogs = logs.slice(0, visibleCount);
  const hasMore = visibleCount < logs.length;

  return (
    <main className="p-4 sm:p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B] dark:text-slate-100">Activity Log</h1>
          <p className="text-[#64748B] dark:text-slate-400">Timeline of all admin operations on teachers and students.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={cn('w-4 h-4 mr-2', refreshing && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      <Card className="card-shadow dark:border-slate-800 dark:bg-slate-950">
        <CardContent className="p-6">
          {showSkeleton ? (
            <SkeletonLoader />
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-[#64748B] dark:text-slate-400">
              <p>No activity logged yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {visibleLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-4 p-4 border border-[#E2E8F0] rounded-lg hover:bg-[#F8FAFC] transition-colors dark:border-slate-800 dark:hover:bg-slate-900"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#F1F5F9] flex items-center justify-center dark:bg-slate-900">
                    {getActionIcon(log.action_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-[#1E293B] break-words dark:text-slate-100">
                        {buildDescription(log)}
                      </p>
                      {getActionBadge(log.action_type)}
                    </div>
                    <p className="text-sm text-[#64748B] dark:text-slate-400">
                      {formatTimestamp(log.timestamp)}
                    </p>
                  </div>
                </div>
              ))}

              {hasMore && (
                <div className="mt-6 text-center">
                  <Button
                    variant="outline"
                    onClick={() => setVisibleCount((count) => Math.min(count + 20, logs.length))}
                    disabled={loading || refreshing}
                  >
                    Load More
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
