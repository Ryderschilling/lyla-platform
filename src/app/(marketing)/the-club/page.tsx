import type { Metadata } from 'next';
import Link from 'next/link';
import { getPhotoManifest } from '@/lib/photos';
import { PhotoSlot } from '@/components/ui/PhotoSlot';
import { Reveal, Magnetic } from '@/components/ui/motion';
import { DemoRoom } from '@/components/marketing/DemoRoom';
import { EmailCapture } from '@/components/marketing/EmailCapture';

export const metadata: Metadata = { title: 'The Club' };
export const dynamic = 'force-dynamic';

const FEATURES = [
  {
    k: 'DAILY',
    kc: 'text-coral',
    title: 'A new WOD every sunrise',
    body: "Drops at 5AM Central, written by Lyla herself — supersets, tempos, finishers. Never a recycled library.",
  },
  {
    k: 'BUILT-IN',
    kc: 'text-sea',
    title: 'The timer runs your workout',
    body: 'Stopwatch and EMOM modes tuned to the day. Gold final ten seconds. Your phone against a water bottle is the whole setup.',
  },
  {
    k: 'COACHING',
    kc: 'text-coral',
    title: 'Ask-coach chat, mid-workout',
    body: "An AI assistant that knows today's workout inside out — scaling, form cues, swaps — in Lyla's voice. Real questions go straight to her.",
  },
  {
    k: 'SEEN',
    kc: 'text-gold',
    title: 'Lyla actually notices',
    body: 'Streaks, ten-second reviews, and a coach who reads every single one and programs next week around real people.',
  },
];

const JOIN_STEPS = [
  { n: '01', title: 'Venmo Lyla', body: 'Send your first month to @LylaSchilling with your email in the note.' },
  { n: '02', title: 'She sets you up', body: 'Lyla creates your login personally — usually same-day — and sends your password.' },
  { n: '03', title: 'Tomorrow, 5AM', body: 'Your first workout is waiting with the sunrise. Streak starts at one.' },
];

const FAQ = [
  {
    q: 'Do I need a gym?',
    a: 'No. Most days need a kettlebell or a pair of dumbbells and floor space. When a movement needs more, the coach chat hands you a swap on the spot.',
  },
  {
    q: "What if I've never lifted?",
    a: "Perfect — you have zero bad habits to unlearn. Every movement has a demo, every workout scales down, and \"progress, not perfection\" isn't a slogan, it's the programming.",
  },
  {
    q: 'Can I cancel?',
    a: "Anytime, zero guilt trip. Message Lyla, you're out. Founders who come back later rejoin at the going rate — the $29 lock is a founding-member thing.",
  },
  {
    q: 'Is the faith stuff heavy?',
    a: "It's Lyla — faith shows up warm and personal, never as a lecture. You'll see a verse in a caption, not a sermon in your workout.",
  },
];

export default function TheClubPage() {
  const photos = getPhotoManifest();
  return (
    <div className="pb-24 pt-28 md:pt-36">
      {/* pitch */}
      <div className="mx-auto max-w-6xl px-5 md:px-10">
        <Reveal>
          <p className="eyebrow text-coral">The Progress Club · membership</p>
          <h1 className="mt-3 max-w-[15ch] font-display text-[clamp(38px,6vw,68px)] font-normal leading-[1.0] tracking-tight">
            This is the <em className="italic text-coral">whole thing.</em>
          </h1>
          <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-ink2">
            Not screenshots — the actual training room, live. The timer runs, the coach chat answers. The only thing
            missing is your streak.
          </p>
        </Reveal>

        {/* live demo */}
        <Reveal delay={0.12} className="mt-10">
          <DemoRoom />
          <p className="mt-4 max-w-3xl text-[13px] leading-relaxed text-mute">
            <b className="font-semibold text-ink2">Go ahead, touch it.</b> Run the EMOM, ask the coach how to scale the
            split squats. Members get this every morning with demo videos, streaks, and Lyla on the other end.
          </p>
        </Reveal>
      </div>

      {/* what you get + photos */}
      <div className="mt-20 border-y border-line2 bg-[rgba(255,252,244,0.55)] md:mt-28">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-20 md:px-10 md:py-28 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <div>
            <Reveal>
              <p className="eyebrow text-sea">What you get</p>
              <h2 className="mt-3 max-w-[16ch] font-display text-[clamp(30px,4.6vw,52px)] font-normal leading-[1.02] tracking-tight">
                Presence, <em className="italic text-coral">not a library.</em>
              </h2>
            </Reveal>
            <div className="mt-9 grid gap-4 sm:grid-cols-2">
              {FEATURES.map((f, i) => (
                <Reveal key={f.k} delay={i * 0.07}>
                  <div className="h-full rounded-2xl border border-line bg-card p-6">
                    <span className={`font-mono text-[9.5px] tracking-[0.2em] ${f.kc}`}>{f.k}</span>
                    <h3 className="mt-3 font-display text-[19px] font-normal leading-tight">{f.title}</h3>
                    <p className="mt-2.5 text-[13.5px] leading-relaxed text-ink2">{f.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
          <Reveal delay={0.15}>
            <div className="grid grid-cols-2 gap-4">
              <PhotoSlot src={photos['club-01']} slot="club-01" aspect="3/4" frame="arch" alt="Morning workout" />
              <PhotoSlot src={photos['club-02']} slot="club-02" aspect="3/4" frame="rounded" className="mt-8" alt="Kettlebell work" />
              <PhotoSlot src={photos['club-03']} slot="club-03" aspect="3/4" frame="rounded" className="-mt-8" alt="Post-workout" />
              <PhotoSlot src={photos['club-04']} slot="club-04" aspect="3/4" frame="arch" alt="30A sunrise" />
            </div>
          </Reveal>
        </div>
      </div>

      {/* pricing */}
      <div className="mx-auto max-w-6xl px-5 py-20 md:px-10 md:py-28">
        <Reveal>
          <p className="eyebrow text-gold">One price, no tiers</p>
          <h2 className="mt-3 max-w-[18ch] font-display text-[clamp(30px,4.6vw,52px)] font-normal leading-[1.02] tracking-tight">
            Less than a single <em className="italic text-coral">drop-in class.</em>
          </h2>
        </Reveal>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <Reveal>
            <div className="flex h-full flex-col rounded-3xl border-2 border-gold/60 bg-card p-8 md:p-10">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] tracking-[0.2em] text-[#9C7220]">FOUNDING 20</span>
                <span className="rounded-full bg-gold px-3 py-1.5 font-mono text-[8.5px] tracking-[0.16em] text-night-bg">
                  LOCKED FOR LIFE
                </span>
              </div>
              <p className="mt-6 font-display text-6xl font-normal">
                $29<span className="font-mono text-base text-mute">/mo</span>
              </p>
              <p className="mt-3 text-sm leading-relaxed text-ink2">
                The first twenty members lock $29 for as long as they stay. When the founders&apos; spots are gone,
                they&apos;re gone.
              </p>
              <ul className="mt-6 space-y-2.5 text-sm text-ink2">
                {['Every daily WOD + demos', 'Timer + ask-coach chat', 'Direct line to Lyla', 'Streaks + progress tracking', 'The Locker discounts'].map((x) => (
                  <li key={x} className="flex items-start gap-2.5">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                    {x}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
          <Reveal delay={0.08}>
            <div className="flex h-full flex-col rounded-3xl bg-ink p-8 text-shell md:p-10">
              <span className="font-mono text-[10px] tracking-[0.2em] text-coral">THE CLUB</span>
              <p className="mt-6 font-display text-6xl font-normal">
                $39<span className="font-mono text-base text-night-sub">/mo</span>
              </p>
              <p className="mt-3 text-sm leading-relaxed text-night-sub">
                Everything in the Club, month to month, cancel whenever. The price of one boutique class — for every
                single morning.
              </p>
              <div className="mt-auto pt-8">
                <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-night-sub">
                  Every 25 members ≈ $1k/mo toward Lyla coaching full-time. You&apos;re not buying an app — you&apos;re
                  backing a coach.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>

      {/* how to join */}
      <div className="border-y border-line2 bg-[rgba(255,252,244,0.55)]">
        <div className="mx-auto max-w-6xl px-5 py-20 md:px-10 md:py-28">
          <Reveal>
            <p className="eyebrow text-coral">How to join</p>
            <h2 className="mt-3 max-w-[18ch] font-display text-[clamp(30px,4.6vw,52px)] font-normal leading-[1.02] tracking-tight">
              No checkout page. <em className="italic text-coral">A person.</em>
            </h2>
            <p className="mt-4 max-w-xl text-[15px] text-ink2">
              The Club is small on purpose right now — Lyla sets up every member herself.
            </p>
          </Reveal>
          <div className="mt-10 grid gap-4 md:grid-cols-3 md:gap-5">
            {JOIN_STEPS.map((s, i) => (
              <Reveal key={s.n} delay={i * 0.09}>
                <div className="h-full rounded-2xl border border-line bg-card p-7">
                  <span className="font-mono text-[11px] tracking-[0.1em] text-coral">{s.n}</span>
                  <h3 className="mt-3 font-display text-[20px] font-normal">{s.title}</h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-ink2">{s.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.2}>
            <div className="mt-8 flex flex-wrap items-center gap-5">
              <Magnetic>
                <a
                  href="https://venmo.com/u/LylaSchilling"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block rounded-full bg-coral px-7 py-3.5 font-mono text-[11px] tracking-[0.14em] text-card shadow-[0_14px_30px_-12px_rgba(222,122,82,0.55)] transition-colors duration-300 hover:bg-corald"
                >
                  VENMO @LYLASCHILLING →
                </a>
              </Magnetic>
              <Link
                href="/contact"
                className="border-b border-line pb-1 font-mono text-[11px] tracking-[0.12em] text-ink transition-colors duration-300 hover:border-coral hover:text-coral"
              >
                Questions first? Say hey →
              </Link>
            </div>
          </Reveal>
        </div>
      </div>

      {/* FAQ + free week */}
      <div className="mx-auto max-w-6xl px-5 pt-20 md:px-10 md:pt-28">
        <div className="grid gap-12 lg:grid-cols-[1fr_0.9fr] lg:gap-20">
          <div>
            <Reveal>
              <p className="eyebrow text-sea">Fair questions</p>
              <h2 className="mt-3 font-display text-[clamp(28px,4vw,44px)] font-normal leading-[1.05] tracking-tight">
                Asked and <em className="italic text-coral">answered.</em>
              </h2>
            </Reveal>
            <div className="mt-8 divide-y divide-line border-y border-line">
              {FAQ.map((f, i) => (
                <Reveal key={f.q} delay={i * 0.05}>
                  <details className="group py-5">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-[18px] [&::-webkit-details-marker]:hidden">
                      {f.q}
                      <span className="font-mono text-sm text-coral transition-transform duration-300 group-open:rotate-45">+</span>
                    </summary>
                    <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink2">{f.a}</p>
                  </details>
                </Reveal>
              ))}
            </div>
          </div>
          <Reveal delay={0.12}>
            <div className="rounded-3xl border border-line bg-card p-8 md:p-10">
              <p className="eyebrow text-gold">Not ready to commit?</p>
              <h3 className="mt-3 font-display text-[clamp(24px,3vw,34px)] font-normal leading-[1.05]">
                Steal a week <em className="italic text-coral">first.</em>
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-ink2">
                Seven real Club workouts, straight to your inbox. If you don&apos;t love training with Lyla, we part as
                friends.
              </p>
              <div className="mt-6">
                <EmailCapture source="the-club" />
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
