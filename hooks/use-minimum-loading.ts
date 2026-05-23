'use client';

import { useEffect, useRef, useState } from 'react';

export function useMinimumLoading(loading: boolean, minimumMs = 500) {
  const [visible, setVisible] = useState(loading);
  const startedAt = useRef<number | null>(loading ? Date.now() : null);

  useEffect(() => {
    if (loading) {
      startedAt.current = Date.now();
      setVisible(true);
      return;
    }

    const elapsed = startedAt.current ? Date.now() - startedAt.current : minimumMs;
    const remaining = Math.max(minimumMs - elapsed, 0);
    const timeout = window.setTimeout(() => {
      setVisible(false);
      startedAt.current = null;
    }, remaining);

    return () => window.clearTimeout(timeout);
  }, [loading, minimumMs]);

  return visible;
}
