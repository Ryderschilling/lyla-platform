'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import type { PhotoManifest, ReelSlot } from '@/lib/photos';
import { PhotoSlot } from '../ui/PhotoSlot';
import { EASE, MaskRise, Magnetic, Reveal } from '../ui/motion';
import { EmailCapture } from './EmailCapture';
import { Marquee } from './Marquee';
import { ReelTile } from './ReelTile';

const STEPS = [
  {
    n: '01',
    k: 'LYLA PROGRAMS IT',
    kColor: 'text-coral',
    title: 'She writes every workout',
    body: 'No library, no algorithm. Lyla programs the Club by hand — supersets, tempos, finishers — the same training she does on 30A.',
  },
  {
    n: '02',
    k: 'IT DROPS AT 5AM',
    kColor: 'text-sea',
    title: 'A new WOD every sunrise',
    body: "Open your phone and today's workout is waiting: movement demos, a timer that runs your EMOMs, and a coach chat that knows every rep.",
  },
  {
    n: '03',
    k: 'YOU SHOW UP',
    kColor: 'text-gold',
    title: 'Your streak does the rest',
    body: 'Mark it complete, tell Lyla how it felt, watch the streak grow. She reads every review and programs next week around real people.',
  },
];

const TESTIMONIALS = [
  {
    quote: 'It feels like Lyla is in the room with you. I check in before my coffee finishes brewing.',
    who: 'BROOKLYN R.',
    tag: 'FOUNDING MEMBER',
  },
  {
    quote: "First program I've stuck with past week two — because someone actually notices when I show up.",
    who: 'EZRA S.',
    tag: 'FOUNDING MEMBER',
  },
  {
    quote: 'Strong without the obsession. Faith without the lecture. Exactly her feed, but for my mornings.',
    who: 'CLUB MEMBER',
    tag: 'THE PROGRESS CLUB',
  },
];

export function HomeClient({ photos, reels }: { photos: PhotoManifest; reels: ReelSlot[] }) {
  return (
    <>
      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden pt-28 md:pt-36">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-16 md:px-10 md:pb-24 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <div>
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: EASE }}
              className="eyebrow text-sea"
            >
              Nutrition + strength coach · Santa Rosa Beach, FL
            </motion.p>
            <MaskRise
              className="mt-5 font-display text-[clamp(44px,7.4vw,84px)] font-normal leading-[0.98] tracking-tight text-ink"
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
              className="mt-6 max-w-md text-[15px] leading-relaxed text-ink2 md:text-base"
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
                  className="inline-block rounded-full bg-coral px-7 py-3.5 font-mono text-[11px] tracking-[0.14em] text-card shadow-[0_14px_30px_-12px_rgba(222,122,82,0.55)] transition-colors duration-300 hover:bg-corald"
                >
                  JOIN THE PROGRESS CLUB
                </Link>
              </Magnetic>
              <Link
                href="/the-club"
                className="border-b border-line pb-1 font-mono text-[11px] tracking-[0.12em] text-ink transition-colors duration-300 hover:border-coral hover:text-coral"
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
              <EmailCapture source="home-hero" />
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, delay: 0.35, ease: EASE }}
            className="relative mx-auto w-full max-w-[420px] lg:max-w-none"
          >
            <PhotoSlot
              src={photos['hero-main']}
              slot="hero-main"
              aspect="4/5"
              frame="arch"
              duotone={!!photos['hero-main']}
              alt="Lyla Schilling training at golden hour"
              className="w-full"
            >
              <span className="absolute inset-x-0 bottom-5 px-6 text-center font-mono text-[9px] uppercase tracking-[0.24em] text-shell/90">
                Built on 30A · Sweat, pray, repeat
              </span>
            </PhotoSlot>
          </motion.div>
        </div>
        <Marquee />
      </section>

      {/* ============ REELS PEEK ============ */}
      <section className="mx-auto max-w-6xl px-5 py-20 md:px-10 md:py-28">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="eyebrow text-coral">From the feed</p>
              <h2 className="mt-3 max-w-[16ch] font-display text-[clamp(30px,4.6vw,52px)] font-normal leading-[1.02] tracking-tight">
                The training is <em className="italic text-coral">already public.</em>
              </h2>
            </div>
            <Link
              href="/watch"
              className="border-b border-line pb-1 font-mono text-[11px] tracking-[0.12em] text-ink transition-colors duration-300 hover:border-coral hover:text-coral"
            >
              Watch all 20 →
            </Link>
          </div>
        </Reveal>
        <div className="mt-10 grid grid-cols-3 gap-3 md:gap-5">
          {reels.map((reel, i) => (
            <Reveal key={reel.slot} delay={i * 0.09}>
              <ReelTile reel={reel} mode="peek" />
            </Reveal>
          ))}
        </div>
      </section>

      {/* ============ HOW THE CLUB WORKS ============ */}
      <section className="border-y border-line2 bg-[rgba(255,252,244,0.55)]">
        <div className="mx-auto max-w-6xl px-5 py-20 md:px-10 md:py-28">
          <Reveal>
            <p className="eyebrow text-sea">How the Club works</p>
            <h2 className="mt-3 max-w-[18ch] font-display text-[clamp(30px,4.6vw,52px)] font-normal leading-[1.02] tracking-tight">
              A coach in your pocket, <em className="italic text-coral">every sunrise.</em>
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-4 md:grid-cols-3 md:gap-5">
            {STEPS.map((s, i) => (
              <Reveal key={s.n} delay={i * 0.1}>
                <div className="group h-full rounded-2xl border border-line bg-card p-7 transition-all duration-500 ease-brand hover:-translate-y-1 hover:shadow-[0_24px_60px_-30px_rgba(35,48,41,0.25)]">
                  <div className="flex items-baseline justify-between">
                    <span className={`font-mono text-[10px] tracking-[0.2em] ${s.kColor}`}>{s.k}</span>
                    <span className="font-mono text-[11px] text-mute">{s.n}</span>
                  </div>
                  <h3 className="mt-4 font-display text-[21px] font-normal leading-tight">{s.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-ink2">{s.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ ABOUT / HER ============ */}
      <section className="mx-auto max-w-6xl px-5 py-20 md:px-10 md:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <Reveal className="relative">
            <div className="grid grid-cols-[1.4fr_1fr] gap-4">
              <PhotoSlot
                src={photos['about-01']}
                slot="about-01"
                aspect="3/4"
                frame="arch"
                alt="Lyla on the beach"
              />
              <div className="flex flex-col gap-4 pt-10">
                <PhotoSlot src={photos['about-02']} slot="about-02" aspect="1/1" frame="rounded" alt="Garage gym session" />
                <PhotoSlot src={photos['about-03']} slot="about-03" aspect="4/5" frame="rounded" alt="Protein cookies" />
              </div>
            </div>
          </Reveal>
          <div>
            <Reveal>
              <p className="eyebrow text-coral">Hey, I&apos;m Lyla</p>
              <h2 className="mt-3 max-w-[16ch] font-display text-[clamp(30px,4.6vw,52px)] font-normal leading-[1.05] tracking-tight">
                Strong looks <em className="italic text-coral">good</em> on you.
              </h2>
            </Reveal>
            <Reveal delay={0.08}>
              <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-ink2">
                <p>
                  I&apos;m a nutrition and strength coach on 30A. Real training, real food, real faith — zero gym-bro energy. I
                  don&apos;t believe in punishing yourself into a body; I believe in showing up, a little, every single day.
                </p>
                <p>
                  The Progress Club is my feed turned into a daily habit: I write the workouts, I answer the messages, I read
                  every review, and I know your name. Show up messy. Show up anyway.
                </p>
              </div>
            </Reveal>
            <Reveal delay={0.14}>
              <p className="mt-7 font-display text-xl italic text-ink">Sweat, pray, repeat.</p>
              <p className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.22em] text-mute">
                Daughter of the King · Santa Rosa Beach, FL
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============ TESTIMONIALS ============ */}
      <section className="border-y border-line2 bg-[rgba(255,252,244,0.55)]">
        <div className="mx-auto max-w-6xl px-5 py-20 md:px-10 md:py-28">
          <Reveal>
            <p className="eyebrow text-gold">The Club, in their words</p>
            <h2 className="mt-3 max-w-[18ch] font-display text-[clamp(30px,4.6vw,52px)] font-normal leading-[1.02] tracking-tight">
              People stay where they&apos;re <em className="italic text-coral">noticed.</em>
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-4 md:grid-cols-3 md:gap-5">
            {TESTIMONIALS.map((t, i) => (
              <Reveal key={t.who} delay={i * 0.1}>
                <figure className="flex h-full flex-col rounded-2xl border border-line bg-card p-7">
                  <blockquote className="font-display text-[17px] italic leading-relaxed text-ink">
                    “{t.quote}”
                  </blockquote>
                  <figcaption className="mt-auto pt-6">
                    <span className="block text-sm font-bold">{t.who}</span>
                    <span className="mt-1 inline-block rounded-full bg-gold/15 px-2.5 py-1 font-mono text-[8px] tracking-[0.16em] text-[#9C7220]">
                      {t.tag}
                    </span>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CLOSING CTA ============ */}
      <section className="mx-auto max-w-6xl px-5 py-20 md:px-10 md:py-28">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl bg-ink px-7 py-14 text-center text-shell md:px-16 md:py-20">
            <p className="eyebrow text-gold">$39/mo · first 20 founders lock in $29</p>
            <h2 className="mx-auto mt-4 max-w-[18ch] font-display text-[clamp(30px,5vw,56px)] font-normal leading-[1.02] tracking-tight">
              Your first sunrise is <em className="italic text-coral">tomorrow, 5AM.</em>
            </h2>
            <p className="mx-auto mt-5 max-w-md text-sm text-night-sub">
              Join the Club, get tomorrow&apos;s workout, and let the streak start doing its thing.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-5">
              <Magnetic>
                <Link
                  href="/the-club"
                  className="inline-block rounded-full bg-coral px-7 py-3.5 font-mono text-[11px] tracking-[0.14em] text-night-bg transition-colors duration-300 hover:bg-corald"
                >
                  JOIN THE PROGRESS CLUB
                </Link>
              </Magnetic>
              <Link
                href="/watch"
                className="border-b border-night-line pb-1 font-mono text-[11px] tracking-[0.12em] text-night-sub transition-colors duration-300 hover:border-coral hover:text-coral"
              >
                Watch her train first →
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
