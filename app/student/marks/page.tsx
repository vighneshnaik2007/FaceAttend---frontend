'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function StudentMarksRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/student/dashboard?tab=marks');
  }, [router]);
  return null;
}
