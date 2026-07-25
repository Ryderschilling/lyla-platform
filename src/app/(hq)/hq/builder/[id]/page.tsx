import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { utcToChicagoParts } from '@/lib/dates';
import { BuilderForm } from '@/components/hq/BuilderForm';

export const metadata: Metadata = { title: 'Edit workout' };
export const dynamic = 'force-dynamic';

export default async function EditWorkoutPage({ params }: { params: { id: string } }) {
  await requireAdmin();
  const workout = await db.query.workouts.findFirst({
    where: (w, { eq }) => eq(w.id, params.id),
    with: { movements: { orderBy: (m, { asc }) => [asc(m.seq)] } },
  });
  if (!workout) notFound();

  const { date, time } = utcToChicagoParts(workout.launchAt);
  const emom = workout.timerConfig?.emom;

  return (
    <BuilderForm
      initial={{
        id: workout.id,
        title: workout.title,
        subtitle: workout.subtitle ?? '',
        coachNote: workout.coachNote ?? '',
        date,
        time,
        published: workout.published,
        timer: emom
          ? { mode: 'emom', rounds: emom.rounds, intervalSec: emom.interval_sec, label: emom.label ?? '' }
          : { mode: 'none', rounds: 5, intervalSec: 60, label: '' },
        movements: workout.movements.map((m) => ({
          id: m.id,
          groupLabel: m.groupLabel ?? '',
          name: m.name,
          detail: m.detail ?? '',
          mediaUrl: m.mediaUrl ?? '',
          mediaType: m.mediaType,
        })),
      }}
    />
  );
}
