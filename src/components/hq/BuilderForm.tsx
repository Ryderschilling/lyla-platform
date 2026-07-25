'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveWorkout, deleteWorkout } from '@/lib/actions/hq-actions';

type MovementDraft = {
  id?: string;
  key?: string;
  groupLabel: string;
  name: string;
  detail: string;
  mediaUrl: string;
  mediaType: 'video' | 'image' | null;
};

type Draft = {
  id?: string;
  title: string;
  subtitle: string;
  coachNote: string;
  date: string;
  time: string;
  published: boolean;
  timer: { mode: 'none' | 'emom'; rounds: number; intervalSec: number; label: string };
  movements: MovementDraft[];
};

const field =
  'w-full rounded-xl border border-line bg-shell px-3.5 py-3 text-sm text-ink outline-none transition-colors duration-300 focus:border-coral';
const label = 'mb-1.5 block font-mono text-[9px] uppercase tracking-[0.18em] text-ink2';

let keyCounter = 0;
const nextKey = () => `mv-${++keyCounter}`;

export function BuilderForm({ initial }: { initial: Draft }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>({
    ...initial,
    movements: initial.movements.map((m) => ({ ...m, key: m.id ?? nextKey() })),
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const setMove = (key: string, patch: Partial<MovementDraft>) =>
    setDraft((d) => ({ ...d, movements: d.movements.map((m) => (m.key === key ? { ...m, ...patch } : m)) }));

  const move = (key: string, dir: -1 | 1) =>
    setDraft((d) => {
      const i = d.movements.findIndex((m) => m.key === key);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= d.movements.length) return d;
      const copy = [...d.movements];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return { ...d, movements: copy };
    });

  const upload = async (key: string, file: File) => {
    setUploading(key);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error === 'too_big' ? 'That file is over 50MB — trim it down.' : 'Upload failed — try again.');
      setMove(key, { mediaUrl: json.url, mediaType: json.mediaType });
    } catch (e: any) {
      setError(e.message ?? 'Upload failed');
    } finally {
      setUploading(null);
    }
  };

  const save = async (published: boolean) => {
    setSaving(true);
    setError(null);
    const res = await saveWorkout({
      id: draft.id,
      title: draft.title,
      subtitle: draft.subtitle,
      coachNote: draft.coachNote,
      date: draft.date,
      time: draft.time,
      published,
      timer: {
        mode: draft.timer.mode,
        rounds: draft.timer.rounds,
        intervalSec: draft.timer.intervalSec,
        label: draft.timer.label,
      },
      movements: draft.movements.map(({ key, ...m }) => ({
        id: m.id,
        groupLabel: m.groupLabel,
        name: m.name,
        detail: m.detail,
        mediaUrl: m.mediaUrl,
        mediaType: m.mediaType,
      })),
    });
    setSaving(false);
    if (!res.ok) {
      setError(res.error ?? 'Something slipped — check the form.');
      return;
    }
    router.push('/hq/builder');
    router.refresh();
  };

  const groupLabels = Array.from(new Set(draft.movements.map((m) => m.groupLabel).filter(Boolean)));

  return (
    <div className="mx-auto max-w-3xl">
      <p className="eyebrow text-coral">{draft.id ? 'Editing' : 'New workout'}</p>
      <h1 className="mt-2 font-display text-3xl font-normal">{draft.title || 'Untitled workout'}</h1>

      <div className="mt-6 space-y-5">
        {/* basics */}
        <div className="rounded-2xl border border-line bg-card p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={label}>Title</label>
              <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Glute + Hamstring Builder" className={field} />
            </div>
            <div>
              <label className={label}>Subtitle</label>
              <input value={draft.subtitle} onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })} placeholder="Lower body · 40 minutes" className={field} />
            </div>
            <div>
              <label className={label}>Launch (America/Chicago)</label>
              <div className="flex gap-2">
                <input type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} className={field} />
                <input type="time" value={draft.time} onChange={(e) => setDraft({ ...draft, time: e.target.value })} className={`${field} w-32`} />
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className={label}>Coach note — your voice, top of their screen</label>
              <textarea
                value={draft.coachNote}
                onChange={(e) => setDraft({ ...draft, coachNote: e.target.value })}
                rows={2}
                placeholder="Slow on the way down — that's where you get strong."
                className={`${field} resize-y`}
              />
            </div>
          </div>
        </div>

        {/* movements */}
        <div className="rounded-2xl border border-line bg-card p-6">
          <p className="font-mono text-[8.5px] tracking-[0.2em] text-coral">MOVEMENTS</p>
          <p className="mt-1.5 text-[12px] text-mute">
            Rows sharing a group label become a superset (A1, A2…). A group with one movement gets a single letter.
          </p>
          <datalist id="group-labels">
            {groupLabels.map((g) => (
              <option key={g} value={g} />
            ))}
          </datalist>

          <div className="mt-4 space-y-3">
            {draft.movements.map((m, i) => (
              <div key={m.key} className="rounded-xl border border-dashed border-line bg-shell p-3.5">
                <div className="grid gap-2.5 sm:grid-cols-[1fr_1fr]">
                  <input
                    value={m.groupLabel}
                    onChange={(e) => setMove(m.key!, { groupLabel: e.target.value })}
                    list="group-labels"
                    placeholder="Group — e.g. SUPERSET A — REST 1:00"
                    className={`${field} bg-card font-mono text-[11px] tracking-[0.06em]`}
                  />
                  <div className="flex gap-2">
                    <input
                      value={m.name}
                      onChange={(e) => setMove(m.key!, { name: e.target.value })}
                      placeholder="Movement — e.g. Romanian Deadlift"
                      className={`${field} bg-card`}
                    />
                  </div>
                  <input
                    value={m.detail}
                    onChange={(e) => setMove(m.key!, { detail: e.target.value })}
                    placeholder="Detail — e.g. 4×8 · :03 LOWERING"
                    className={`${field} bg-card font-mono text-[11px] tracking-[0.06em]`}
                  />
                  <div className="flex items-center gap-2">
                    {m.mediaUrl ? (
                      <span className="flex min-w-0 items-center gap-2 rounded-full border border-sea/50 bg-sea/10 px-3 py-2 font-mono text-[8.5px] tracking-[0.1em] text-sea">
                        {m.mediaType === 'video' ? 'DEMO VIDEO' : 'DEMO PHOTO'} ✓
                        <button type="button" onClick={() => setMove(m.key!, { mediaUrl: '', mediaType: null })} className="text-corald">
                          ✕
                        </button>
                      </span>
                    ) : (
                      <label className="flex cursor-pointer items-center gap-2 rounded-full border border-dashed border-sea/50 px-3 py-2 font-mono text-[8.5px] tracking-[0.1em] text-sea transition-colors hover:bg-sea/10">
                        {uploading === m.key ? 'UPLOADING…' : '⬆ DEMO VIDEO/PHOTO'}
                        <input
                          type="file"
                          accept="video/mp4,video/webm,video/quicktime,image/*"
                          className="hidden"
                          disabled={uploading !== null}
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) upload(m.key!, f);
                            e.target.value = '';
                          }}
                        />
                      </label>
                    )}
                    <span className="ml-auto flex shrink-0 gap-1">
                      <button type="button" onClick={() => move(m.key!, -1)} disabled={i === 0} aria-label="Move up" className="h-7 w-7 rounded-full border border-line text-[10px] text-ink2 disabled:opacity-30">↑</button>
                      <button type="button" onClick={() => move(m.key!, 1)} disabled={i === draft.movements.length - 1} aria-label="Move down" className="h-7 w-7 rounded-full border border-line text-[10px] text-ink2 disabled:opacity-30">↓</button>
                      <button
                        type="button"
                        onClick={() => setDraft((d) => ({ ...d, movements: d.movements.filter((x) => x.key !== m.key) }))}
                        disabled={draft.movements.length === 1}
                        aria-label="Remove movement"
                        className="h-7 w-7 rounded-full border border-line text-[10px] text-corald disabled:opacity-30"
                      >
                        ✕
                      </button>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() =>
              setDraft((d) => ({
                ...d,
                movements: [
                  ...d.movements,
                  { key: nextKey(), groupLabel: d.movements[d.movements.length - 1]?.groupLabel ?? '', name: '', detail: '', mediaUrl: '', mediaType: null },
                ],
              }))
            }
            className="mt-4 font-mono text-[9.5px] tracking-[0.14em] text-sea transition-colors hover:text-coral"
          >
            + ADD MOVEMENT
          </button>
        </div>

        {/* timer */}
        <div className="rounded-2xl border border-line bg-card p-6">
          <p className="font-mono text-[8.5px] tracking-[0.2em] text-coral">FINISHER TIMER</p>
          <div className="mt-3.5 flex flex-wrap items-center gap-3">
            <div className="flex gap-1.5">
              {(['none', 'emom'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setDraft({ ...draft, timer: { ...draft.timer, mode } })}
                  className={`rounded-full border px-4 py-2 font-mono text-[9px] tracking-[0.14em] transition-colors ${
                    draft.timer.mode === mode ? 'border-coral text-coral' : 'border-line text-ink2 hover:text-ink'
                  }`}
                >
                  {mode === 'none' ? 'STOPWATCH ONLY' : 'EMOM PRESET'}
                </button>
              ))}
            </div>
            {draft.timer.mode === 'emom' && (
              <div className="flex flex-wrap items-center gap-2.5">
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={draft.timer.rounds}
                  onChange={(e) => setDraft({ ...draft, timer: { ...draft.timer, rounds: Number(e.target.value) } })}
                  className={`${field} w-20`}
                  aria-label="Rounds"
                />
                <span className="font-mono text-[9px] text-mute">ROUNDS ×</span>
                <input
                  type="number"
                  min={10}
                  max={600}
                  step={5}
                  value={draft.timer.intervalSec}
                  onChange={(e) => setDraft({ ...draft, timer: { ...draft.timer, intervalSec: Number(e.target.value) } })}
                  className={`${field} w-24`}
                  aria-label="Interval seconds"
                />
                <span className="font-mono text-[9px] text-mute">SEC ·</span>
                <input
                  value={draft.timer.label}
                  onChange={(e) => setDraft({ ...draft, timer: { ...draft.timer, label: e.target.value } })}
                  placeholder='Round label — "12 SWINGS"'
                  className={`${field} w-44 font-mono text-[11px]`}
                />
              </div>
            )}
          </div>
        </div>

        {/* actions */}
        <div className="flex flex-wrap items-center gap-3.5 pb-10">
          <button
            type="button"
            disabled={saving}
            onClick={() => save(true)}
            className="rounded-full bg-coral px-6 py-3.5 font-mono text-[10.5px] tracking-[0.16em] text-card transition-colors duration-300 hover:bg-corald disabled:opacity-60"
          >
            {saving ? 'SAVING…' : `SCHEDULE — DROPS ${draft.date || '…'} ${draft.time || ''} CT`}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => save(false)}
            className="rounded-full border border-line px-5 py-3.5 font-mono text-[10px] tracking-[0.16em] text-ink2 transition-colors duration-300 hover:border-coral hover:text-coral disabled:opacity-60"
          >
            SAVE DRAFT
          </button>
          {draft.id && (
            <button
              type="button"
              disabled={saving}
              onClick={async () => {
                if (!confirm('Delete this workout? Completions and reviews attached to it go too.')) return;
                await deleteWorkout(draft.id!);
                router.push('/hq/builder');
                router.refresh();
              }}
              className="ml-auto font-mono text-[9px] tracking-[0.14em] text-mute transition-colors hover:text-corald"
            >
              DELETE WORKOUT
            </button>
          )}
          {error && <p className="w-full text-[13px] text-corald">{error}</p>}
        </div>
      </div>
    </div>
  );
}
