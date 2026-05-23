'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TeacherNotificationsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/teacher/dashboard?tab=notifications');
  }, [router]);
  return null;
}
