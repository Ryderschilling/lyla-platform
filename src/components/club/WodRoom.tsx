'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { completeWorkout, submitReview } from '@/lib/actions/club-actions';
import { Timer } from './Timer';
import { CoachChat } from './CoachChat';
import { GroupLabel, MovementRow } from './room-pieces';
import { RiseMark } from '../ui/marks';
import { EASE } from '../ui/motion';

type Move = { id: string; idx: string; name: string; detail: string | null; mediaUrl: string | null; mediaType: string | null };
type Group = { label: string | null; moves: Move[] };
type ReviewData = { difficulty: 'too_easy' | 'just_right' | 'too_hard'; favoriteMovementId: string | null; note: string | null };

const DIFFICULTIES: Array<{ key: ReviewData['difficulty']; label: string }> = [
  { key: 'too_easy', label: 'TOO EASY' },
  { key: 'just_right', label: 'JUST RIGHT' },
  { key: 'too_hard', label: 'TOO HARD' },
];

export function WodRoom({
  workout,
  groups,
  completed,
  review,
  streak,
  showCoach,
  autoReview = false,
}: {
  workout: { id: string; title: string; subtitle: string | null; coachNote: string | null; stamp: string; emom: { rounds: number; interval_sec: number; label?: string } | null };
  groups: Group[];
  completed: boolean;
  review: ReviewData | null;
  streak: number;
  showCoach: boolean;
  /** ?review=1 — arriving from the "leave a review" button opens the form straight away. */
  autoReview?: boolean;
}) {
  const router = useRouter();
  const [isDone, setIsDone] = useState(completed);
  const [celebrating, setCelebrating] = useState(false);
  const [newStreak, setNewStreak] = useState(streak);
  const [reviewOpen, setReviewOpen] = useState(autoReview && completed);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [media, setMedia] = useState<Move | null>(null);

  // review form state
  const [difficulty, setDifficulty] = useState<ReviewData['difficulty'] | null>(review?.difficulty ?? null);
  const [favorite, setFavorite] = useState<string | null>(review?.favoriteMovementId ?? null);
  const [note, setNote] = useState(review?.note ?? '');
  const [reviewSaved, setReviewSaved] = useState(!!review);

  const allMoves = groups.flatMap((g) => g.moves);

  const onComplete = async () => {
    setSaving(true);
    setError(null);
    const res = await completeWorkout(workout.id);
    setSaving(false);
    if (!res.ok) {
      setError(res.error ?? 'Something slipped — try again.');
      return;
    }
    setIsDone(true);
    setNewStreak(res.streak ?? streak + 1);
    setCelebrating(true);
    setTimeout(() => {
      setCelebrating(false);
      setReviewOpen(true);
    }, 1900);
  };

  const onReview = async () => {
    if (!difficulty) {
      setError('Pick how it felt first.');
      return;
    }
    setSaving(true);
    setError(null);
    const res = await submitReview({ workoutId: workout.id, difficulty, favoriteMovementId: favorite, note: note.trim() || undefined });
    setSaving(false);
    if (!res.ok) {
      setError(res.error ?? 'Something slipped — try again.');
      return;
    }
    setReviewSaved(true);
    setReviewOpen(false);
    router.refresh();
  };

  return (
    <div className="grid min-h-[calc(100vh-56px)] lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_420px]">
      {/* main column */}
      <div className="min-w-0 p-5 md:p-7">
        <p className="flex items-center gap-2 font-mono text-[9.5px] tracking-[0.24em] text-coral">
          <RiseMark className="h-3.5 w-3.5" />
          {workout.stamp}
        </p>
        <h1 className="mt-2.5 font-display text-[clamp(26px,3.4vw,38px)] font-normal leading-tight text-night-text">{workout.title}</h1>
        {(workout.coachNote || workout.subtitle) && (
          <p className="mt-1.5 max-w-2xl text-[13.5px] leading-relaxed text-night-sub">
            {workout.coachNote ?? workout.subtitle}
          </p>
        )}

        {/* the movements are the page — they get the full column width, not a narrow reading measure */}
        <div className="mt-6 flex max-w-4xl flex-col gap-3">
          {groups.map((g, gi) => (
            <div key={gi} className="flex flex-col gap-3">
              {g.label && <GroupLabel>{g.label}</GroupLabel>}
              {g.moves.map((m) => (
                <MovementRow
                  key={m.id}
                  idx={m.idx}
                  name={m.name}
                  detail={m.detail}
                  mediaUrl={m.mediaUrl}
                  mediaType={m.mediaType}
                  onPlay={() => setMedia(m)}
                />
              ))}
            </div>
          ))}
        </div>

        {/* complete / review zone */}
        <div className="mt-8 max-w-4xl">
          {!isDone ? (
            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={onComplete}
                disabled={saving}
                className="rounded-full bg-coral px-6 py-3.5 font-mono text-[10.5px] tracking-[0.16em] text-night-bg transition-all duration-300 hover:brightness-110 disabled:opacity-60"
              >
                {saving ? 'SAVING…' : 'MARK COMPLETE →'}
              </button>
              <span className="font-mono text-[9px] tracking-[0.16em] text-night-sub">FINISH → 10-SECOND REVIEW → STREAK GROWS</span>
            </div>
          ) : !reviewOpen ? (
            <div className="rounded-2xl border border-gold/30 bg-gold/[0.07] p-5">
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-2 rounded-full border border-gold/40 px-3.5 py-2 font-mono text-[9.5px] tracking-[0.18em] text-gold">
                  <RiseMark className="h-3 w-3" />
                  DONE — DAY {newStreak}
                </span>
                {reviewSaved ? (
                  <span className="font-mono text-[9px] tracking-[0.14em] text-night-sub">
                    REVIEW IN — LYLA READS EVERY ONE
                  </span>
                ) : null}
                <button
                  type="button"
                  onClick={() => setReviewOpen(true)}
                  className="ml-auto font-mono text-[9.5px] tracking-[0.14em] text-night-sub underline decoration-night-line underline-offset-4 transition-colors hover:text-night-text"
                >
                  {reviewSaved ? 'EDIT REVIEW' : 'LEAVE THE 10-SECOND REVIEW'}
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-night-line bg-night-card p-5 md:p-6">
              <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-night-sub">The 10-second review</p>
              <div className="mt-3.5 flex flex-wrap gap-2">
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d.key}
                    type="button"
                    onClick={() => setDifficulty(d.key)}
                    className={`rounded-full border px-3.5 py-2 font-mono text-[8.5px] tracking-[0.12em] transition-colors duration-300 ${
                      difficulty === d.key ? 'border-coral text-coral' : 'border-night-line text-night-sub hover:text-night-text'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
              <p className="mb-2 mt-4 font-mono text-[9px] uppercase tracking-[0.22em] text-night-sub">Favorite movement</p>
              <div className="flex flex-wrap gap-2">
                {allMoves.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setFavorite(favorite === m.id ? null : m.id)}
                    className={`rounded-full border px-3 py-1.5 font-mono text-[8.5px] tracking-[0.1em] transition-colors duration-300 ${
                      favorite === m.id ? 'border-sea bg-sea/15 text-[#7FB5AD]' : 'border-night-line text-night-sub hover:text-night-text'
                    }`}
                  >
                    {m.name.toUpperCase()}
                  </button>
                ))}
              </div>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                maxLength={2000}
                placeholder="Anything Lyla should know? (optional)"
                className="mt-4 w-full resize-y rounded-xl border border-night-line bg-night-bg px-3.5 py-3 text-[13px] text-night-text outline-none transition-colors focus:border-coral/60"
              />
              <div className="mt-4 flex items-center gap-4">
                <button
                  type="button"
                  onClick={onReview}
                  disabled={saving}
                  className="rounded-full bg-coral px-5 py-2.5 font-mono text-[10px] tracking-[0.16em] text-night-bg transition-all duration-300 hover:brightness-110 disabled:opacity-60"
                >
                  {saving ? 'SENDING…' : 'SEND TO LYLA →'}
                </button>
                <button
                  type="button"
                  onClick={() => setReviewOpen(false)}
                  className="font-mono text-[9.5px] tracking-[0.14em] text-night-sub hover:text-night-text"
                >
                  LATER
                </button>
              </div>
            </div>
          )}
          {error && <p className="mt-3 text-[13px] text-coral">{error}</p>}
        </div>
      </div>

      {/* right rail */}
      <aside className="flex flex-col border-t border-night-line lg:sticky lg:top-14 lg:h-[calc(100vh-56px)] lg:border-l lg:border-t-0">
        <Timer emomDefault={workout.emom} />
        {showCoach ? (
          <CoachChat />
        ) : (
          <div className="flex min-h-[220px] flex-1 items-center justify-center p-6 text-center">
            <p className="max-w-[26ch] font-mono text-[10px] uppercase leading-relaxed tracking-[0.18em] text-night-sub">
              Ask-coach lives on today&apos;s WOD — it only ever knows the current workout
            </p>
          </div>
        )}
      </aside>

      {/* streak celebration — the gold moment */}
      <AnimatePresence>
        {celebrating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="fixed inset-0 z-[70] flex flex-col items-center justify-center bg-night-bg/92 bg-[rgba(20,30,26,0.94)] backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.6, y: 26, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              transition={{ duration: 0.9, ease: EASE, delay: 0.1 }}
              className="flex flex-col items-center"
            >
              <RiseMark className="h-16 w-16 text-gold" />
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.55 }}
                className="mt-6 font-mono text-[11px] uppercase tracking-[0.3em] text-gold"
              >
                Streak
              </motion.p>
              <motion.p
                initial={{ y: '60%', opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: EASE, delay: 0.45 }}
                className="tab-nums font-mono text-[96px] leading-none text-gold"
              >
                {newStreak}
              </motion.p>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
                className="mt-4 font-display text-xl italic text-night-text"
              >
                You showed up. That&apos;s the whole secret.
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* movement media modal */}
      <AnimatePresence>
        {media && media.mediaUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: EASE }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-[rgba(20,30,26,0.92)] p-5 backdrop-blur-sm"
            onClick={() => setMedia(null)}
          >
            <motion.div
              initial={{ scale: 0.94, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 8 }}
              transition={{ duration: 0.45, ease: EASE }}
              className="w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-3 flex items-center justify-between">
                <p className="font-mono text-[10px] tracking-[0.18em] text-night-text">
                  <span className="text-coral">{media.idx}</span> · {media.name.toUpperCase()}
                </p>
                <button
                  type="button"
                  onClick={() => setMedia(null)}
                  className="rounded-full border border-night-line px-3.5 py-1.5 font-mono text-[9px] tracking-[0.14em] text-night-sub hover:text-night-text"
                >
                  CLOSE
                </button>
              </div>
              {media.mediaType === 'image' ? (
                <img src={media.mediaUrl} alt={`${media.name} demo`} className="w-full rounded-2xl border border-night-line" />
              ) : (
                <video src={media.mediaUrl} controls autoPlay playsInline className="w-full rounded-2xl border border-night-line" />
              )}
              {media.detail && <p className="mt-3 text-center font-mono text-[10px] tracking-[0.1em] text-night-sub">{media.detail}</p>}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
