'use client';

import { ReactLenis } from 'lenis/react';
import type { ReactNode } from 'react';

export function LenisProvider({ children }: { children: ReactNode }) {
  return (
    <ReactLenis root options={{ lerp: 0.11, wheelMultiplier: 1 }}>
      {children}
    </ReactLenis>
  );
}
