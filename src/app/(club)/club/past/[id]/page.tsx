import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { getLaunchedWorkoutWithMovements, getTodayWorkout, getUserStreak, groupMovements } from '@/lib/queries';
import { db, schema } from '@/lib/db';
import { and, eq } from 'drizzle-orm';
import { dropStamp } from '@/lib/dates';
import { WodRoom } from '@/components/club/WodRoom';

export const dynamic = 'force-dynamic';

export default async function PastWorkoutPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { review?: string };
}) {
  const session = await requireUser();
  const workout = await getLaunchedWorkoutWithMovements(params.id);
  if (!workout) notFound(); // future or unpublished workouts never leak

  const [completion, review, streak, today] = await Promise.all([
    db.query.completions.findFirst({
      where: and(eq(schema.completions.userId, session.id), eq(schema.completions.workoutId, workout.id)),
    }),
    db.query.reviews.findFirst({
      where: and(eq(schema.reviews.userId, session.id), eq(schema.reviews.workoutId, workout.id)),
    }),
    getUserStreak(session.id),
    getTodayWorkout(),
  ]);

  const groups = groupMovements(workout.movements).map((g) => ({
    label: g.label,
    moves: g.moves.map((m) => ({ id: m.id, idx: m.idx, name: m.name, detail: m.detail, mediaUrl: m.mediaUrl, mediaType: m.mediaType })),
  }));

  return (
    <WodRoom
      workout={{
        id: workout.id,
        title: workout.title,
        subtitle: workout.subtitle,
        coachNote: workout.coachNote,
        stamp: dropStamp(workout.launchAt),
        emom: workout.timerConfig?.emom ?? null,
      }}
      groups={groups}
      completed={!!completion}
      review={review ? { difficulty: review.difficulty, favoriteMovementId: review.favoriteMovementId, note: review.note } : null}
      streak={streak.current}
      showCoach={today?.id === workout.id}
      autoReview={searchParams?.review === '1'}
    />
  );
}
