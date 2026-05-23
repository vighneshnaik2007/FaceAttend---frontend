'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminSettingsPage() {
  const apiBackend = process.env.NEXT_PUBLIC_API_URL ?? 'Not configured';

  return (
    <main className="p-4 sm:p-8">
      <h1 className="text-2xl font-bold text-[#1E293B] mb-2">Settings</h1>
      <p className="text-[#64748B] mb-8">College-wide configuration</p>
      <Card className="card-shadow max-w-xl">
        <CardHeader>
          <CardTitle className="text-lg">FaceAttend System</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-[#64748B] space-y-2">
          <p>API backend: {apiBackend}</p>
          <p>Minimum attendance: 75%</p>
          <p>Teachers and students are created only through this admin panel.</p>
          <p className="pt-4 text-xs">
            Portal URLs: /teacher/login · /student/login
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
