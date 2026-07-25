import type { Metadata } from 'next';
import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { dropStamp } from '@/lib/dates';

export const metadata: Metadata = { title: 'Workout builder' };
export const dynamic = 'force-dynamic';

export default async function BuilderListPage() {
  await requireAdmin();
  const workouts = await db.query.workouts.findMany({
    orderBy: (w, { desc }) => [desc(w.launchAt)],
    with: { movements: true },
  });

  const now = Date.now();
  const scheduled = workouts.filter((w) => w.published && w.launchAt.getTime() > now);
  const drafts = workouts.filter((w) => !w.published);
  const launched = workouts.filter((w) => w.published && w.launchAt.getTime() <= now);

  const section = (label: string, items: typeof workouts, accent: string, empty: string) => (
    <div className="rounded-2xl border border-line bg-card p-5">
      <p className={`font-mono text-[8.5px] tracking-[0.2em] ${accent}`}>{label}</p>
      {items.length === 0 ? (
        <p className="mt-3 text-[13px] text-mute">{empty}</p>
      ) : (
        <div className="mt-2 divide-y divide-line2">
          {items.map((w) => (
            <Link key={w.id} href={`/hq/builder/${w.id}`} className="group flex items-center gap-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-[14px] font-bold transition-colors group-hover:text-coral">{w.title}</p>
                <p className="mt-0.5 font-mono text-[8.5px] tracking-[0.1em] text-mute">
                  {dropStamp(w.launchAt).replace('DROPPED', w.launchAt.getTime() > now ? 'DROPS' : 'DROPPED')} ·{' '}
                  {w.movements.length} MOVEMENTS
                </p>
              </div>
              <span className="ml-auto shrink-0 font-mono text-[9px] tracking-[0.14em] text-mute group-hover:text-coral">
                EDIT →
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-coral">Build Sundays, coast all week</p>
          <h1 className="mt-2 font-display text-3xl font-normal">Workout builder</h1>
        </div>
        <Link
          href="/hq/builder/new"
          className="rounded-full bg-coral px-5 py-3 font-mono text-[10px] tracking-[0.16em] text-card transition-colors duration-300 hover:bg-corald"
        >
          + NEW WORKOUT
        </Link>
      </div>

      <div className="mt-6 grid gap-4">
        {section('SCHEDULED — DROPS AUTOMATICALLY', scheduled, 'text-[#9C7220]', 'Nothing queued. Tomorrow needs a workout!')}
        {section('DRAFTS', drafts, 'text-sea', 'No drafts sitting around.')}
        {section('LAUNCHED', launched, 'text-coral', 'Nothing launched yet — your first drop is one Schedule away.')}
      </div>
    </div>
  );
}
