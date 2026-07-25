'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Keeps a server-rendered page feeling live without a websocket. */
export function AutoRefresh({ seconds = 12 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') router.refresh();
    }, seconds * 1000);
    return () => clearInterval(id);
  }, [router, seconds]);
  return null;
}
