'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { EASE, MaskRise, Magnetic } from '../ui/motion';
import { EmailCapture } from './EmailCapture';

/**
 * HERO — full-bleed photo background with the cut-out of Lyla layered back on
 * top of the copy, so the type passes behind her.
 *
 * The two images come off the SAME canvas, so as long as they get the same
 * FIT + TRANSFORM they land on each other pixel-perfect and read as one photo.
 * Change one, change both — that is why these are shared constants.
 *
 * The scrims sit between the plate and the copy. The cut-out sits above the
 * copy, so it would otherwise miss that wash and glow brighter than the photo
 * around her. Fix: the same scrims are repainted over the cut-out, MASKED by
 * her own alpha, so they land on her and nowhere else. The type never gets
 * scrimmed twice.
 */
const NIGHT = '#141E1A';

/** How the photo fills the frame. */
const FIT = 'object-cover object-[50%_50%]';

/**
 * Zoom + nudge on desktop.
 * TUNE: scale = how zoomed. translate-x = which way (negative = left).
 * Hard rule — |translate-x| must stay under (scale - 1) / 2 as a percent, or
 * the zoom runs out of overshoot and you expose a bare edge. At 1.12 that
 * ceiling is 6%. origin-top keeps her head put and lets the cropped legs grow.
 */
const TRANSFORM = 'lg:scale-[1.12] lg:translate-x-[-4%] lg:origin-top';

const GRADE = 'brightness(0.78) saturate(1.02) sepia(0.08)';
/** Lyla sits a touch brighter than the plate so she reads forward of it. */
const GRADE_CUT = 'brightness(0.88) saturate(1.06) sepia(0.06)';
/** ...and takes less of the scrim than the photo around her. */
const CUT_SCRIM_OPACITY = 0.7;

const SCRIM_X =
  'linear-gradient(260deg, rgba(20,30,26,0.90) 0%, rgba(20,30,26,0.72) 30%, rgba(20,30,26,0.30) 58%, rgba(20,30,26,0.10) 78%, rgba(20,30,26,0.30) 100%)';
const SCRIM_Y =
  'linear-gradient(180deg, rgba(20,30,26,0.55) 0%, rgba(20,30,26,0) 26%), linear-gradient(0deg, rgba(20,30,26,0.60) 0%, rgba(20,30,26,0) 30%)';

export function HeroStage({ bg, cut }: { bg: string | null; cut: string | null }) {
  /** Paints a scrim only where Lyla's silhouette is. Matches `object-cover` via cover/centre. */
  const maskToLyla = cut
    ? {
        WebkitMaskImage: `url(${cut})`,
        maskImage: `url(${cut})`,
        WebkitMaskSize: 'cover',
        maskSize: 'cover',
        WebkitMaskPosition: '50% 50%',
        maskPosition: '50% 50%',
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat',
      }
    : {};

  return (
    <section
      className="relative flex min-h-[100svh] flex-col overflow-hidden"
      style={{ background: NIGHT }}
    >
      {/* ---------- the photo ---------- */}
      {bg && (
        <motion.img
          src={bg}
          alt="Lyla Schilling training on 30A"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, ease: EASE }}
          className={`absolute inset-0 h-full w-full select-none ${FIT} ${TRANSFORM}`}
          style={{ filter: GRADE }}
        />
      )}

      {/* ---------- scrim: keeps the copy readable, nothing more ---------- */}
      <div aria-hidden className="absolute inset-0" style={{ background: SCRIM_X }} />
      <div aria-hidden className="absolute inset-0" style={{ background: SCRIM_Y }} />

      {/* ---------- copy ---------- */}
      <div className="relative z-20 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-5 pb-16 pt-28 md:px-10 lg:pb-24">
        <div className="max-w-[560px] lg:ml-auto lg:max-w-[640px] lg:-translate-x-12">
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EASE }}
            className="eyebrow text-gold"
          >
            Nutrition + strength coach · Santa Rosa Beach, FL
          </motion.p>

          <MaskRise
            className="mt-5 font-display text-[clamp(46px,7.4vw,86px)] font-normal leading-[0.96] tracking-tight text-night-text"
            lines={[
              <span key="1">Chase progress,</span>,
              <em key="2" className="italic text-coral">
                not perfection.
              </em>,
            ]}
          />

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.5, ease: EASE }}
            className="mt-6 max-w-sm text-[15px] leading-relaxed text-night-sub md:text-base"
          >
            A new workout every sunrise, coaching in your pocket, and a club that notices when you show up.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.62, ease: EASE }}
            className="mt-8 flex flex-wrap items-center gap-5"
          >
            <Magnetic>
              <Link
                href="/the-club"
                className="inline-block rounded-full bg-coral px-7 py-3.5 font-mono text-[11px] tracking-[0.14em] text-night-bg shadow-[0_18px_44px_-14px_rgba(222,122,82,0.7)] transition-colors duration-300 hover:bg-corald"
              >
                JOIN THE PROGRESS CLUB
              </Link>
            </Magnetic>
            <Link
              href="/the-club"
              className="border-b border-night-line pb-1 font-mono text-[11px] tracking-[0.12em] text-night-text transition-colors duration-300 hover:border-coral hover:text-coral"
            >
              See how the Club works →
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.74, ease: EASE }}
            className="mt-10 max-w-md"
          >
            <EmailCapture source="home-hero" dark />
          </motion.div>
        </div>
      </div>

      {/* ---------- Lyla, back on top of the type ---------- */}
      {cut && (
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-0 z-30 ${TRANSFORM}`}
        >
          <motion.img
            src={cut}
            alt=""
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, ease: EASE }}
            className={`absolute inset-0 h-full w-full select-none ${FIT}`}
            style={{ filter: GRADE_CUT }}
          />
          {/* the same wash the plate gets, clipped to her silhouette */}
          <div
            className="absolute inset-0"
            style={{ background: SCRIM_X, opacity: CUT_SCRIM_OPACITY, ...maskToLyla }}
          />
          <div
            className="absolute inset-0"
            style={{ background: SCRIM_Y, opacity: CUT_SCRIM_OPACITY, ...maskToLyla }}
          />
        </div>
      )}

      {/* ---------- grain ---------- */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-40 opacity-[0.06] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
    </section>
  );
}
