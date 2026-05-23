'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function StudentAttendanceRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/student/dashboard?tab=attendance');
  }, [router]);
  return null;
}
