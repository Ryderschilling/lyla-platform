import { requireUser } from '@/lib/auth';
import { getTodayWorkout, getUserStreak, groupMovements } from '@/lib/queries';
import { db, schema } from '@/lib/db';
import { and, eq } from 'drizzle-orm';
import { dropStamp } from '@/lib/dates';
import { WodRoom } from '@/components/club/WodRoom';
import { SunMark } from '@/components/ui/marks';

export const dynamic = 'force-dynamic';

export default async function TodayPage() {
  const session = await requireUser();
  const workout = await getTodayWorkout();

  if (!workout) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-5 px-6 text-center">
        <SunMark className="h-10 w-10 text-night-sub" />
        <h1 className="font-display text-3xl font-normal text-night-text">Nothing&apos;s dropped yet.</h1>
        <p className="max-w-sm text-sm leading-relaxed text-night-sub">
          Today&apos;s workout lands at 5:00 AM Central. Stretch, hydrate, or go back to sleep — the sunrise has you covered.
        </p>
      </div>
    );
  }

  const [completion, review, streak] = await Promise.all([
    db.query.completions.findFirst({
      where: and(eq(schema.completions.userId, session.id), eq(schema.completions.workoutId, workout.id)),
    }),
    db.query.reviews.findFirst({
      where: and(eq(schema.reviews.userId, session.id), eq(schema.reviews.workoutId, workout.id)),
    }),
    getUserStreak(session.id),
  ]);

  const groups = groupMovements(workout.movements).map((g) => ({
    label: g.label,
    moves: g.moves.map((m) => ({
      id: m.id,
      idx: m.idx,
      name: m.name,
      detail: m.detail,
      mediaUrl: m.mediaUrl,
      mediaType: m.mediaType,
    })),
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
      showCoach
    />
  );
}
