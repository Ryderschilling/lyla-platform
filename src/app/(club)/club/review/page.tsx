import type { Metadata } from 'next';
import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { db, schema } from '@/lib/db';
import { desc, eq } from 'drizzle-orm';
import { shortStamp } from '@/lib/dates';
import { SunMark } from '@/components/ui/marks';

export const metadata: Metadata = { title: 'Leave a review' };
export const dynamic = 'force-dynamic';

const TAGS: Record<string, { label: string; cls: string }> = {
  too_easy: { label: 'TOO EASY', cls: 'border-sea/40 text-[#7FB5AD]' },
  just_right: { label: 'JUST RIGHT', cls: 'border-gold/40 text-gold' },
  too_hard: { label: 'TOO HARD', cls: 'border-coral/40 text-coral' },
};

export default async function ReviewPage() {
  const session = await requireUser();
  const completions = await db.query.completions.findMany({
    where: eq(schema.completions.userId, session.id),
    with: { workout: true },
    orderBy: desc(schema.completions.completedAt),
  });
  const myReviews = await db.query.reviews.findMany({ where: eq(schema.reviews.userId, session.id) });
  const reviewed = new Map(myReviews.map((r) => [r.workoutId, r]));

  const pending = completions.filter((c) => !reviewed.has(c.workoutId));
  const done = completions.filter((c) => reviewed.has(c.workoutId));

  return (
    <div className="mx-auto max-w-2xl p-5 md:p-7">
      <p className="eyebrow text-night-sub">Ten seconds that shape next week</p>
      <h1 className="mt-2 font-display text-3xl font-normal text-night-text">Leave a review</h1>
      <p className="mt-2 max-w-md text-[13px] leading-relaxed text-night-sub">
        Lyla reads every single one and programs around them. Reviews live on each workout&apos;s page.
      </p>

      {/* nothing finished yet — one clear way forward */}
      {completions.length === 0 && (
        <div className="mt-8 flex flex-col items-center gap-5 rounded-2xl border border-dashed border-night-line px-6 py-14 text-center">
          <SunMark className="h-7 w-7 text-night-sub" />
          <p className="max-w-[34ch] text-sm leading-relaxed text-night-sub">
            Reviews unlock once you finish a workout. Hit today&apos;s session and the 10-second review pops up right
            there — your takes land here after.
          </p>
          <Link
            href="/club"
            className="rounded-full bg-coral px-6 py-3.5 font-mono text-[10.5px] tracking-[0.16em] text-night-bg transition-all duration-300 hover:brightness-110"
          >
            GO TO TODAY&apos;S WOD →
          </Link>
        </div>
      )}

      {pending.length > 0 && (
        <>
          <p className="mt-8 font-mono text-[9px] uppercase tracking-[0.22em] text-coral">Waiting on you</p>
          <div className="mt-3 flex flex-col gap-2.5">
            {pending.map((c) => (
              <div
                key={c.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-[13px] border border-coral/30 bg-night-card px-4 py-4"
              >
                <span className="w-14 shrink-0 font-mono text-[9.5px] tracking-[0.12em] text-coral">
                  {shortStamp(c.workout.launchAt)}
                </span>
                <span className="min-w-0 flex-1 truncate text-[14px] font-bold text-night-text">{c.workout.title}</span>
                <Link
                  href={`/club/past/${c.workoutId}?review=1`}
                  className="ml-auto shrink-0 rounded-full bg-coral px-5 py-2.5 font-mono text-[9.5px] tracking-[0.16em] text-night-bg transition-all duration-300 hover:brightness-110"
                >
                  LEAVE REVIEW →
                </Link>
              </div>
            ))}
          </div>
        </>
      )}

      {done.length > 0 && (
        <>
          <p className="mt-8 font-mono text-[9px] uppercase tracking-[0.22em] text-night-sub">Already in</p>
          <div className="mt-3 flex flex-col gap-2.5">
            {done.map((c) => {
              const r = reviewed.get(c.workoutId)!;
              const tag = TAGS[r.difficulty];
              return (
                <div key={c.id} className="rounded-[13px] border border-night-line bg-night-card px-4 py-4">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                    <span className="min-w-0 flex-1 truncate text-[14px] font-bold text-night-text">{c.workout.title}</span>
                    {tag && (
                      <span className={`shrink-0 rounded-full border px-2.5 py-1 font-mono text-[7.5px] tracking-[0.16em] ${tag.cls}`}>
                        {tag.label}
                      </span>
                    )}
                  </div>
                  {r.note && <p className="mt-2 text-[12.5px] italic leading-relaxed text-night-sub">&quot;{r.note}&quot;</p>}
                  <div className="mt-3.5 flex items-center gap-3">
                    <Link
                      href={`/club/past/${c.workoutId}?review=1`}
                      className="rounded-full border border-night-line px-4 py-2 font-mono text-[9px] tracking-[0.16em] text-night-sub transition-colors duration-300 hover:border-night-sub/50 hover:text-night-text"
                    >
                      EDIT REVIEW
                    </Link>
                    <Link
                      href={`/club/past/${c.workoutId}`}
                      className="font-mono text-[9px] tracking-[0.14em] text-night-sub underline decoration-night-line underline-offset-4 transition-colors hover:text-night-text"
                    >
                      SEE THE WORKOUT
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
