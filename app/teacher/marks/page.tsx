'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TeacherMarksRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/teacher/dashboard?tab=marks');
  }, [router]);
  return null;
}
