'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { EASE } from '@/components/ui/motion';
import { saveIntake, updateMyProfile, type IntakePayload } from '@/lib/actions/club-actions';
import { AGREEMENT_SECTIONS, AGREEMENT_ACCEPT_LABEL, AI_DISCLAIMER_LONG } from '@/lib/legal';

export type IntakeDraft = {
  age: string;
  heightFt: string;
  heightInches: string;
  weightLb: string;
  experience: string;
  daysPerWeek: string;
  goal: string;
  injuries: string;
  equipment: string;
  anythingElse: string;
};

export const EMPTY_DRAFT: IntakeDraft = {
  age: '',
  heightFt: '',
  heightInches: '',
  weightLb: '',
  experience: '',
  daysPerWeek: '',
  goal: '',
  injuries: '',
  equipment: '',
  anythingElse: '',
};

const EXPERIENCE = [
  { v: 'brand_new', l: 'Brand new', d: 'Never really trained, or starting over' },
  { v: 'some', l: 'Some experience', d: 'On and off, know the basic lifts' },
  { v: 'consistent', l: 'Consistent', d: 'Training most weeks already' },
  { v: 'athlete', l: 'Athlete', d: 'Years in — CrossFit, sport, or serious lifting' },
];

const input =
  'w-full rounded-xl border border-night-line bg-night-card2 px-3.5 py-3 text-[15px] text-night-text outline-none transition-colors duration-300 focus:border-coral';
const lbl = 'font-mono text-[9px] tracking-[0.18em] text-night-sub';

function toPayload(d: IntakeDraft) {
  const num = (v: string) => (v.trim() === '' ? null : Number(v));
  return {
    age: num(d.age),
    heightFt: num(d.heightFt),
    heightInches: num(d.heightInches) ?? 0,
    weightLb: num(d.weightLb),
    experience: (d.experience || null) as IntakePayload['experience'],
    daysPerWeek: num(d.daysPerWeek),
    goal: d.goal,
    injuries: d.injuries,
    equipment: d.equipment,
    anythingElse: d.anythingElse,
  };
}

/* ------------------------------------------------------------------ */
/* shared field blocks — used by both the wizard and the account editor */
/* ------------------------------------------------------------------ */

function BasicsFields({ d, set }: { d: IntakeDraft; set: (p: Partial<IntakeDraft>) => void }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <label htmlFor="in-age" className={lbl}>
          AGE
        </label>
        <input id="in-age" inputMode="numeric" value={d.age} onChange={(e) => set({ age: e.target.value.replace(/\D/g, '') })} placeholder="28" className={`${input} mt-2`} />
      </div>
      <div>
        <label htmlFor="in-ft" className={lbl}>
          HEIGHT
        </label>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <div className="relative">
            <input id="in-ft" inputMode="numeric" value={d.heightFt} onChange={(e) => set({ heightFt: e.target.value.replace(/\D/g, '') })} placeholder="5" className={`${input} pr-10`} />
            <span aria-hidden className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center font-mono text-[10px] tracking-[0.1em] text-night-sub">FT</span>
          </div>
          <div className="relative">
            <input aria-label="Height — inches" inputMode="numeric" value={d.heightInches} onChange={(e) => set({ heightInches: e.target.value.replace(/\D/g, '') })} placeholder="6" className={`${input} pr-10`} />
            <span aria-hidden className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center font-mono text-[10px] tracking-[0.1em] text-night-sub">IN</span>
          </div>
        </div>
      </div>
      <div>
        <label htmlFor="in-wt" className={lbl}>
          WEIGHT (LB) — OPTIONAL
        </label>
        <input id="in-wt" inputMode="numeric" value={d.weightLb} onChange={(e) => set({ weightLb: e.target.value.replace(/\D/g, '') })} placeholder="Skip it if you'd rather not" className={`${input} mt-2`} />
        <p className="mt-1.5 font-mono text-[8px] leading-relaxed tracking-[0.1em] text-night-sub/70">
          ONLY USED TO SCALE LOADS. NEVER SHOWN TO ANYONE BUT LYLA.
        </p>
      </div>
    </div>
  );
}

function TrainingFields({ d, set }: { d: IntakeDraft; set: (p: Partial<IntakeDraft>) => void }) {
  return (
    <div className="space-y-5">
      <div>
        <span className={lbl}>WHERE YOU&apos;RE AT</span>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {EXPERIENCE.map((e) => (
            <button
              key={e.v}
              type="button"
              onClick={() => set({ experience: d.experience === e.v ? '' : e.v })}
              aria-pressed={d.experience === e.v}
              className={`rounded-xl border p-3.5 text-left transition-colors duration-300 ${
                d.experience === e.v ? 'border-coral bg-coral/10' : 'border-night-line bg-night-card2 hover:border-coral/50'
              }`}
            >
              <span className="block text-[14px] font-bold text-night-text">{e.l}</span>
              <span className="mt-0.5 block text-[12px] leading-snug text-night-sub">{e.d}</span>
            </button>
          ))}
        </div>
      </div>
      <div>
        <span className={lbl}>DAYS A WEEK YOU CAN TRAIN</span>
        <div className="mt-2 flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5, 6, 7].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => set({ daysPerWeek: d.daysPerWeek === String(n) ? '' : String(n) })}
              aria-pressed={d.daysPerWeek === String(n)}
              className={`h-11 w-11 rounded-full border font-mono text-[12px] transition-colors duration-300 ${
                d.daysPerWeek === String(n) ? 'border-coral bg-coral/15 text-coral' : 'border-night-line text-night-sub hover:border-coral/60 hover:text-night-text'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label htmlFor="in-equip" className={lbl}>
          WHAT YOU HAVE ACCESS TO
        </label>
        <input
          id="in-equip"
          value={d.equipment}
          onChange={(e) => set({ equipment: e.target.value })}
          placeholder="Full gym / dumbbells + bands at home / one kettlebell and a mat"
          maxLength={600}
          className={`${input} mt-2`}
        />
      </div>
    </div>
  );
}

function BodyFields({ d, set }: { d: IntakeDraft; set: (p: Partial<IntakeDraft>) => void }) {
  return (
    <div className="space-y-5">
      <div>
        <label htmlFor="in-inj" className={lbl}>
          INJURIES, PAIN, OR ANYTHING TO WORK AROUND
        </label>
        <textarea
          id="in-inj"
          value={d.injuries}
          onChange={(e) => set({ injuries: e.target.value })}
          rows={4}
          maxLength={1500}
          placeholder="Left knee — no jumping or deep lunges. Right shoulder gets cranky overhead. Six months postpartum."
          className={`${input} mt-2 resize-y leading-relaxed`}
        />
        <p className="mt-2 text-[12.5px] leading-relaxed text-night-sub">
          Be specific — this is what lets Lyla and the in-workout coach hand you a swap instead of a movement that hurts.
        </p>
      </div>
      <div>
        <label htmlFor="in-goal" className={lbl}>
          WHAT YOU&apos;RE CHASING
        </label>
        <textarea
          id="in-goal"
          value={d.goal}
          onChange={(e) => set({ goal: e.target.value })}
          rows={3}
          maxLength={600}
          placeholder="Get strong again after having my daughter. I want to feel like myself in a tank top."
          className={`${input} mt-2 resize-y leading-relaxed`}
        />
      </div>
      <div>
        <label htmlFor="in-else" className={lbl}>
          ANYTHING ELSE SHE SHOULD KNOW — OPTIONAL
        </label>
        <textarea
          id="in-else"
          value={d.anythingElse}
          onChange={(e) => set({ anythingElse: e.target.value })}
          rows={3}
          maxLength={1500}
          placeholder="I travel every other week. Mornings are the only time I'll actually do it."
          className={`${input} mt-2 resize-y leading-relaxed`}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* the first-login wizard                                              */
/* ------------------------------------------------------------------ */

const STEPS = ['THE BASICS', 'YOUR TRAINING', 'YOUR BODY', 'THE FINE PRINT'];

export function IntakeWizard({ firstName, initial }: { firstName: string; initial?: IntakeDraft }) {
  const router = useRouter();
  const reduced = useReducedMotion();
  const [step, setStep] = useState(0);
  // `initial` is populated when an existing member is re-consenting to a new
  // agreement version — never make them retype answers they already gave.
  const [d, setD] = useState<IntakeDraft>(initial ?? EMPTY_DRAFT);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const set = (p: Partial<IntakeDraft>) => setD((cur) => ({ ...cur, ...p }));

  const finish = () =>
    start(async () => {
      setError(null);
      const res = await saveIntake({ ...toPayload(d), agreed });
      if (!res.ok) {
        setError(res.error ?? 'Something went sideways — try again.');
        return;
      }
      router.replace('/club');
      router.refresh();
    });

  return (
    <div className="mx-auto w-full max-w-2xl px-5 py-10 md:py-14">
      {/* progress */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex-1">
            <div className={`h-[3px] rounded-full transition-colors duration-500 ${i <= step ? 'bg-coral' : 'bg-night-card2'}`} />
            <p className={`mt-2 font-mono text-[7.5px] tracking-[0.14em] transition-colors duration-500 ${i === step ? 'text-coral' : 'text-night-sub/60'}`}>
              {s}
            </p>
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={reduced ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduced ? undefined : { opacity: 0, y: -10 }}
          transition={{ duration: 0.4, ease: EASE }}
          className="mt-8"
        >
          {step === 0 && (
            <>
              <p className="eyebrow text-coral">Welcome in, {firstName}</p>
              <h1 className="mt-2 font-display text-[clamp(28px,6vw,38px)] font-normal leading-tight text-night-text">
                Let&apos;s get to know you.
              </h1>
              <p className="mt-3 max-w-lg text-[14.5px] leading-relaxed text-night-sub">
                Four quick screens, about ninety seconds. Everything here goes straight to Lyla — and it&apos;s what lets your
                in-workout coach scale a movement to <em>you</em> instead of guessing.
              </p>
              <div className="mt-7">
                <BasicsFields d={d} set={set} />
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <p className="eyebrow text-coral">Step two</p>
              <h1 className="mt-2 font-display text-[clamp(26px,5.5vw,34px)] font-normal leading-tight text-night-text">
                How you train.
              </h1>
              <div className="mt-7">
                <TrainingFields d={d} set={set} />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <p className="eyebrow text-coral">Step three</p>
              <h1 className="mt-2 font-display text-[clamp(26px,5.5vw,34px)] font-normal leading-tight text-night-text">
                Anything we need to work around?
              </h1>
              <div className="mt-7">
                <BodyFields d={d} set={set} />
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <p className="eyebrow text-coral">Last one</p>
              <h1 className="mt-2 font-display text-[clamp(26px,5.5vw,34px)] font-normal leading-tight text-night-text">
                The fine print.
              </h1>
              <p className="mt-3 text-[14px] leading-relaxed text-night-sub">
                Short version: this is coaching, not healthcare. Read it, then check the box.
              </p>

              <div className="mt-5 rounded-2xl border border-gold/35 bg-gold/[0.07] p-4">
                <p className="font-mono text-[8.5px] tracking-[0.18em] text-gold">ABOUT THE AI COACH</p>
                <p className="mt-2 text-[13px] leading-relaxed text-night-text/90">{AI_DISCLAIMER_LONG}</p>
              </div>

              <div className="mt-4 max-h-[38vh] space-y-4 overflow-y-auto rounded-2xl border border-night-line bg-night-card2 p-5">
                {AGREEMENT_SECTIONS.map((s) => (
                  <div key={s.heading}>
                    <p className="font-mono text-[9px] tracking-[0.16em] text-coral">{s.heading.toUpperCase()}</p>
                    <p className="mt-1.5 text-[12.5px] leading-relaxed text-night-sub">{s.body}</p>
                  </div>
                ))}
              </div>

              <button
                type="button"
                role="checkbox"
                aria-checked={agreed}
                onClick={() => setAgreed((v) => !v)}
                className={`mt-4 flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-colors duration-300 ${
                  agreed ? 'border-coral bg-coral/10' : 'border-night-line bg-night-card2 hover:border-coral/50'
                }`}
              >
                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-[11px] transition-colors duration-300 ${
                    agreed ? 'border-coral bg-coral text-night-bg' : 'border-night-sub/50 text-transparent'
                  }`}
                >
                  ✓
                </span>
                <span className="text-[13px] leading-relaxed text-night-text">{AGREEMENT_ACCEPT_LABEL}</span>
              </button>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {error && <p className="mt-4 text-[13.5px] text-coral">{error}</p>}

      <div className="mt-8 flex items-center gap-4">
        {step > 0 && (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            className="font-mono text-[10px] tracking-[0.16em] text-night-sub transition-colors hover:text-night-text"
          >
            ← BACK
          </button>
        )}
        <div className="ml-auto">
          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              className="rounded-full bg-coral px-7 py-3.5 font-mono text-[10px] tracking-[0.18em] text-night-bg transition-colors duration-300 hover:bg-gold"
            >
              NEXT →
            </button>
          ) : (
            <button
              type="button"
              disabled={pending || !agreed}
              onClick={finish}
              className="rounded-full bg-coral px-7 py-3.5 font-mono text-[10px] tracking-[0.18em] text-night-bg transition-colors duration-300 hover:bg-gold disabled:cursor-not-allowed disabled:opacity-40"
            >
              {pending ? 'SAVING…' : 'AGREE & ENTER THE CLUB →'}
            </button>
          )}
        </div>
      </div>

      {step < STEPS.length - 1 && (
        <p className="mt-4 text-right font-mono text-[8px] tracking-[0.12em] text-night-sub/60">
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* the account-page editor (no re-consent)                             */
/* ------------------------------------------------------------------ */

export function ProfileEditor({ initial }: { initial: IntakeDraft }) {
  const router = useRouter();
  const [d, setD] = useState<IntakeDraft>(initial);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const set = (p: Partial<IntakeDraft>) => {
    setSaved(false);
    setD((cur) => ({ ...cur, ...p }));
  };

  return (
    <div className="space-y-7">
      <BasicsFields d={d} set={set} />
      <TrainingFields d={d} set={set} />
      <BodyFields d={d} set={set} />
      <div className="flex items-center gap-4">
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            start(async () => {
              setError(null);
              const res = await updateMyProfile(toPayload(d));
              if (!res.ok) setError(res.error ?? 'Try again');
              else {
                setSaved(true);
                router.refresh();
              }
            })
          }
          className="rounded-full bg-coral px-6 py-3 font-mono text-[10px] tracking-[0.16em] text-night-bg transition-colors duration-300 hover:bg-gold disabled:opacity-50"
        >
          {saved ? 'SAVED ✓' : pending ? 'SAVING…' : 'SAVE MY ANSWERS'}
        </button>
        {error && <p className="text-[13px] text-coral">{error}</p>}
      </div>
    </div>
  );
}
