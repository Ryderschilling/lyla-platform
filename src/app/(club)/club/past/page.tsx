import type { Metadata } from 'next';
import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { getLaunchedWorkouts } from '@/lib/queries';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { shortStamp } from '@/lib/dates';
import { SunMark } from '@/components/ui/marks';

export const metadata: Metadata = { title: 'Past workouts' };
export const dynamic = 'force-dynamic';

export default async function PastPage() {
  const session = await requireUser();
  const [workouts, myCompletions] = await Promise.all([
    getLaunchedWorkouts(),
    db.select({ workoutId: schema.completions.workoutId }).from(schema.completions).where(eq(schema.completions.userId, session.id)),
  ]);
  const done = new Set(myCompletions.map((c) => c.workoutId));

  return (
    <div className="mx-auto max-w-2xl p-5 md:p-7">
      <p className="eyebrow text-night-sub">Everything that&apos;s dropped</p>
      <h1 className="mt-2 font-display text-3xl font-normal text-night-text">Past workouts</h1>

      {workouts.length === 0 ? (
        <div className="mt-16 flex flex-col items-center gap-4 text-center">
          <SunMark className="h-8 w-8 text-night-sub" />
          <p className="text-sm text-night-sub">The archive fills up one sunrise at a time.</p>
        </div>
      ) : (
        <div className="mt-7 flex flex-col gap-2.5">
          {workouts.map((w) => (
            <Link
              key={w.id}
              href={`/club/past/${w.id}`}
              className="group flex items-center gap-4 rounded-[13px] border border-night-line bg-night-card px-4 py-3.5 transition-colors duration-300 hover:border-coral/40"
            >
              <span className="w-14 shrink-0 font-mono text-[9.5px] tracking-[0.12em] text-coral">{shortStamp(w.launchAt)}</span>
              <span className="min-w-0">
                <span className="block truncate text-[14px] font-bold text-night-text">{w.title}</span>
                {w.subtitle && <span className="mt-0.5 block truncate font-mono text-[9px] tracking-[0.08em] text-night-sub">{w.subtitle.toUpperCase()}</span>}
              </span>
              <span
                className={`ml-auto shrink-0 rounded-full border px-3 py-1.5 font-mono text-[8px] tracking-[0.16em] ${
                  done.has(w.id) ? 'border-gold/40 text-gold' : 'border-night-line text-night-sub group-hover:text-night-text'
                }`}
              >
                {done.has(w.id) ? 'DONE' : 'OPEN'}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
