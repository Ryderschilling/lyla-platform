'use client';

import { motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion';
import { useRef, type ReactNode, type CSSProperties } from 'react';

export const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Scroll reveal — rises 26px with the shared ease. Guides, never decorates.
 * Reduced motion: initial={false} renders the settled state (same DOM shape,
 * so no stale framer inline styles survive reconciliation).
 */
export function Reveal({
  children,
  delay = 0,
  className,
  y = 26,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  y?: number;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduced ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -60px 0px' }}
      transition={{ duration: 0.9, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

/** Headline lines rise out of an overflow mask, staggered. */
export function MaskRise({
  lines,
  className,
  lineClassName,
  delay = 0.1,
  as: Tag = 'h1',
}: {
  lines: ReactNode[];
  className?: string;
  lineClassName?: string;
  delay?: number;
  as?: 'h1' | 'h2' | 'h3' | 'div';
}) {
  const reduced = useReducedMotion();
  return (
    <Tag className={className}>
      {lines.map((line, i) => (
        <span key={i} className="block overflow-hidden pb-[0.08em] -mb-[0.08em]">
          <motion.span
            className={`block ${lineClassName ?? ''}`}
            initial={reduced ? false : { y: '108%' }}
            animate={{ y: 0 }}
            transition={{ duration: 1.1, delay: delay + i * 0.12, ease: EASE }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}

/** Magnetic pull toward the cursor — wrap the button, fill stays CSS. */
export function Magnetic({ children, className, strength = 0.32 }: { children: ReactNode; className?: string; strength?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 18, mass: 0.5 });
  const sy = useSpring(y, { stiffness: 220, damping: 18, mass: 0.5 });
  const reduced = useReducedMotion();

  return (
    <motion.div
      ref={ref}
      className={className}
      style={reduced ? { display: 'inline-block' } : { x: sx, y: sy, display: 'inline-block' }}
      onPointerMove={
        reduced
          ? undefined
          : (e) => {
              const r = ref.current?.getBoundingClientRect();
              if (!r) return;
              x.set((e.clientX - (r.left + r.width / 2)) * strength);
              y.set((e.clientY - (r.top + r.height / 2)) * (strength + 0.08));
            }
      }
      onPointerLeave={
        reduced
          ? undefined
          : () => {
              x.set(0);
              y.set(0);
            }
      }
    >
      {children}
    </motion.div>
  );
}

export function ArrowNE({ className = '' }: { className?: string }) {
  const style: CSSProperties = { display: 'inline-block', transform: 'rotate(-45deg)' };
  return (
    <span aria-hidden className={className} style={style}>
      →
    </span>
  );
}
