'use client';

import { useEffect, useRef } from 'react';

/**
 * True background layer — a warm light pool that lags the cursor, painted
 * BEHIND all content (fixed, -z-10). Never an overlay div. Off on touch
 * and for reduced motion.
 */
export function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!fine.matches || reduced.matches) return;

    let mx = window.innerWidth * 0.7;
    let my = window.innerHeight * 0.2;
    let gx = mx;
    let gy = my;
    let raf = 0;

    const onMove = (e: PointerEvent) => {
      mx = e.clientX;
      my = e.clientY;
    };
    const loop = () => {
      gx += (mx - gx) * 0.06;
      gy += (my - gy) * 0.06;
      if (ref.current) {
        ref.current.style.setProperty('--gx', `${gx}px`);
        ref.current.style.setProperty('--gy', `${gy}px`);
      }
      document.documentElement.style.setProperty('--mx', `${gx}px`);
      document.documentElement.style.setProperty('--my', `${gy}px`);
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className="fixed inset-0 -z-10 pointer-events-none"
      style={{
        background:
          'radial-gradient(640px circle at var(--gx, 70%) var(--gy, 20%), rgba(222,122,82,0.13), rgba(223,166,62,0.05) 45%, transparent 68%)',
      }}
    />
  );
}
