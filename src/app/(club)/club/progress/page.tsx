import type { Metadata } from 'next';
import { requireUser } from '@/lib/auth';
import { getUserCompletionDays, getUserActiveDays } from '@/lib/queries';
import { db, schema } from '@/lib/db';
import { eq, sql as dsql } from 'drizzle-orm';
import { chiDay, addDays, computeStreaks } from '@/lib/dates';
import { RiseMark } from '@/components/ui/marks';

export const metadata: Metadata = { title: 'My progress' };
export const dynamic = 'force-dynamic';

const WEEKS = 12;

export default async function ProgressPage() {
  const session = await requireUser();
  const [workoutDays, activeDays, [totals]] = await Promise.all([
    getUserCompletionDays(session.id),
    getUserActiveDays(session.id),
    db
      .select({ total: dsql<number>`count(*)::int` })
      .from(schema.completions)
      .where(eq(schema.completions.userId, session.id)),
  ]);
  // Streaks measure the habit (showing up), not the work (finishing). See lib/queries.
  const { current, best } = computeStreaks(activeDays);
  const total = totals?.total ?? 0;

  // calendar heat: last 12 weeks, columns = weeks, rows = Sun..Sat (Chicago days)
  const today = chiDay();
  const todayDow = new Date(`${today}T12:00:00Z`).getUTCDay();
  const gridStart = addDays(today, -(todayDow + (WEEKS - 1) * 7)); // Sunday, 12 weeks back
  const weeks: string[][] = [];
  for (let w = 0; w < WEEKS; w++) {
    const col: string[] = [];
    for (let d = 0; d < 7; d++) col.push(addDays(gridStart, w * 7 + d));
    weeks.push(col);
  }

  const stats = [
    { label: 'CURRENT STREAK', value: current, accent: 'text-gold', unit: current === 1 ? 'DAY' : 'DAYS' },
    { label: 'BEST STREAK', value: best, accent: 'text-night-text', unit: best === 1 ? 'DAY' : 'DAYS' },
    { label: 'TOTAL WORKOUTS', value: total, accent: 'text-night-text', unit: 'DONE' },
  ];

  return (
    <div className="mx-auto max-w-2xl p-5 md:p-7">
      <p className="eyebrow text-night-sub">Proof you keep showing up</p>
      <h1 className="mt-2 font-display text-3xl font-normal text-night-text">My progress</h1>

      <div className="mt-7 grid gap-3 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-night-line bg-night-card p-5">
            <p className="font-mono text-[8.5px] tracking-[0.2em] text-night-sub">{s.label}</p>
            <p className={`tab-nums mt-2 font-mono text-4xl ${s.accent}`}>
              {s.value}
              <span className="ml-2 text-[10px] tracking-[0.14em] text-night-sub">{s.unit}</span>
            </p>
          </div>
        ))}
      </div>
      <p className="mt-3 font-mono text-[8.5px] leading-relaxed tracking-[0.12em] text-night-sub/70">
        YOUR STREAK COUNTS DAYS YOU SHOWED UP — ONCE PER DAY, WHETHER YOU TRAINED OR JUST CHECKED IN.
      </p>

      <div className="mt-6 rounded-2xl border border-night-line bg-night-card p-5">
        <p className="font-mono text-[8.5px] tracking-[0.2em] text-night-sub">LAST {WEEKS} WEEKS</p>
        <div className="mt-4 grid grid-flow-col justify-between gap-1 overflow-x-auto pb-1">
          {weeks.map((col, wi) => (
            <div key={wi} className="grid grid-rows-7 gap-1">
              {col.map((d) => {
                const future = d > today;
                const trained = workoutDays.has(d);
                const showed = activeDays.has(d);
                return (
                  <span
                    key={d}
                    title={d}
                    className={`h-3.5 w-3.5 rounded-[4px] ${
                      future
                        ? 'bg-transparent'
                        : trained
                          ? d === today
                            ? 'bg-gold shadow-[0_0_10px_rgba(223,166,62,0.45)]'
                            : 'bg-gold/80'
                          : showed
                            ? 'border border-gold/55 bg-gold/10'
                            : 'border border-night-line bg-night-card2'
                    }`}
                  />
                );
              })}
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[8.5px] tracking-[0.14em] text-night-sub">
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 shrink-0 rounded-[4px] bg-gold/80" />
            <span className="flex items-center gap-1.5 text-gold">
              <RiseMark className="h-3 w-3" />
              WORKOUT DONE
            </span>
          </span>
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 shrink-0 rounded-[4px] border border-gold/55 bg-gold/10" />
            SHOWED UP
          </span>
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 shrink-0 rounded-[4px] border border-night-line bg-night-card2" />
            MISSED
          </span>
        </div>
      </div>

      <p className="mt-6 text-center font-display text-lg italic text-night-sub">
        &quot;Streaks over PRs. Showing up over showing off.&quot;
      </p>
    </div>
  );
}
