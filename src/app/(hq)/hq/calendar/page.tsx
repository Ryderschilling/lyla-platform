import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { chiDay } from '@/lib/dates';
import { CalendarGrid } from '@/components/hq/CalendarGrid';

export const metadata: Metadata = { title: 'Launch calendar' };
export const dynamic = 'force-dynamic';

export default async function CalendarPage() {
  await requireAdmin();
  const workouts = await db.query.workouts.findMany({ columns: { id: true, title: true, launchAt: true, published: true } });

  const items = workouts.map((w) => ({
    id: w.id,
    title: w.title,
    day: chiDay(w.launchAt),
    published: w.published,
  }));

  return (
    <div className="mx-auto max-w-4xl">
      <p className="eyebrow text-coral">Build Sundays, coast all week</p>
      <h1 className="mt-2 font-display text-3xl font-normal">Launch calendar</h1>
      <div className="mt-6">
        <CalendarGrid items={items} today={chiDay()} />
      </div>
    </div>
  );
}
