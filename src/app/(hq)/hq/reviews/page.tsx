import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth';
import { db, schema } from '@/lib/db';
import { desc, eq } from 'drizzle-orm';
import { SunMark } from '@/components/ui/marks';

export const metadata: Metadata = { title: 'Reviews inbox' };
export const dynamic = 'force-dynamic';

const TAGS: Record<string, { label: string; cls: string }> = {
  too_hard: { label: 'TOO HARD', cls: 'bg-coral/15 text-corald' },
  just_right: { label: 'JUST RIGHT', cls: 'bg-gold/15 text-[#9C7220]' },
  too_easy: { label: 'TOO EASY', cls: 'bg-sea/10 text-sea' },
};

export default async function ReviewsPage({ searchParams }: { searchParams: { w?: string } }) {
  await requireAdmin();
  const filter = searchParams.w;

  const [reviews, workouts] = await Promise.all([
    db.query.reviews.findMany({
      where: filter ? eq(schema.reviews.workoutId, filter) : undefined,
      orderBy: desc(schema.reviews.createdAt),
      with: { user: true, workout: true, favoriteMovement: true },
    }),
    db.query.workouts.findMany({ orderBy: desc(schema.workouts.launchAt), columns: { id: true, title: true } }),
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <p className="eyebrow text-coral">Ten seconds each, gold for programming</p>
      <h1 className="mt-2 font-display text-3xl font-normal">Reviews inbox</h1>

      <form method="get" className="mt-5">
        <select
          name="w"
          defaultValue={filter ?? ''}
          className="rounded-full border border-line bg-card px-4 py-2.5 font-mono text-[10px] tracking-[0.1em] text-ink outline-none"
        >
          <option value="">ALL WORKOUTS</option>
          {workouts.map((w) => (
            <option key={w.id} value={w.id}>
              {w.title.toUpperCase()}
            </option>
          ))}
        </select>
        <button type="submit" className="ml-2 rounded-full bg-ink px-4 py-2.5 font-mono text-[9.5px] tracking-[0.14em] text-shell transition-colors hover:bg-coral">
          FILTER
        </button>
      </form>

      {reviews.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-4 rounded-2xl border border-dashed border-line bg-card px-6 py-16 text-center">
          <SunMark className="h-7 w-7 text-mute" />
          <p className="max-w-sm text-sm text-ink2">
            No reviews {filter ? 'for that workout ' : ''}yet. They roll in ten seconds after every &quot;mark complete.&quot;
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {reviews.map((r) => {
            const tag = TAGS[r.difficulty];
            return (
              <div key={r.id} className="rounded-xl border border-line bg-card p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2.5 py-1 font-mono text-[7.5px] tracking-[0.16em] ${tag.cls}`}>{tag.label}</span>
                  {r.favoriteMovement && (
                    <span className="rounded-full bg-sea/10 px-2.5 py-1 font-mono text-[7.5px] tracking-[0.16em] text-sea">
                      FAVORITE: {r.favoriteMovement.name.toUpperCase()}
                    </span>
                  )}
                </div>
                {r.note ? (
                  <p className="mt-3 text-[13px] italic leading-relaxed text-ink2">&quot;{r.note}&quot;</p>
                ) : (
                  <p className="mt-3 text-[12px] text-mute">No note — the tags say it all.</p>
                )}
                <p className="mt-3 font-mono text-[8px] tracking-[0.12em] text-mute">
                  {r.user.fullName.toUpperCase()} · {r.workout.title.toUpperCase()}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
