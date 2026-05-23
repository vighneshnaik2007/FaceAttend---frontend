'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function StudentNotificationsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/student/dashboard?tab=notifications');
  }, [router]);
  return null;
}
