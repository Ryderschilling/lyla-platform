'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { saveReferralCode, deleteReferralCode, moveReferralCode } from '@/lib/actions/hq-actions';

type Code = { id?: string; brand: string; code: string; url: string; blurb: string; sort: number };

const field =
  'w-full rounded-xl border border-line bg-shell px-3.5 py-2.5 text-sm text-ink outline-none transition-colors duration-300 focus:border-coral';

function CodeEditor({ code, total, onDone }: { code: Code; total: number; onDone: () => void }) {
  const [draft, setDraft] = useState(code);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const max = code.id ? total : total + 1;

  return (
    <div className="rounded-xl border border-dashed border-line bg-shell p-4">
      <div className="grid gap-2.5 sm:grid-cols-2">
        <input value={draft.brand} onChange={(e) => setDraft({ ...draft, brand: e.target.value })} placeholder="Brand — e.g. Legion Athletics" className={`${field} bg-card`} />
        <input value={draft.code} onChange={(e) => setDraft({ ...draft, code: e.target.value })} placeholder="Code — e.g. LYLA20" className={`${field} bg-card font-mono text-[12px]`} />
        <input value={draft.url} onChange={(e) => setDraft({ ...draft, url: e.target.value })} placeholder="https://link-to-shop.com" className={`${field} bg-card sm:col-span-2`} />
        <input value={draft.blurb} onChange={(e) => setDraft({ ...draft, blurb: e.target.value })} placeholder='Your blurb — "My protein + pre. Actually tastes good."' className={`${field} bg-card sm:col-span-2`} />
        <div className="sm:col-span-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <label htmlFor="locker-pos" className="font-mono text-[9px] tracking-[0.14em] text-mute">
              POSITION
            </label>
            <input
              id="locker-pos"
              type="number"
              min={1}
              max={max}
              value={draft.sort}
              onChange={(e) => setDraft({ ...draft, sort: Number(e.target.value) })}
              className={`${field} tab-nums w-20 bg-card font-mono`}
            />
            <span className="font-mono text-[9px] tracking-[0.12em] text-mute">OF {max}</span>
          </div>
          <p className="mt-1.5 font-mono text-[8px] leading-relaxed tracking-[0.1em] text-mute">
            SET IT TO 1 AND EVERYTHING ELSE SLIDES DOWN — NO DUPLICATE NUMBERS, EVER.
          </p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const res = await saveReferralCode(draft);
              if (res.error) setError(res.error);
              else onDone();
            })
          }
          className="rounded-full bg-coral px-5 py-2.5 font-mono text-[9.5px] tracking-[0.16em] text-card transition-colors hover:bg-corald disabled:opacity-60"
        >
          {pending ? 'SAVING…' : 'SAVE'}
        </button>
        <button type="button" onClick={onDone} className="font-mono text-[9px] tracking-[0.14em] text-mute hover:text-ink">
          CANCEL
        </button>
        {error && <p className="text-[12px] text-corald">{error}</p>}
      </div>
    </div>
  );
}

export function LockerManager({ codes }: { codes: Code[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | 'new' | null>(null);
  const [pending, start] = useTransition();

  const done = () => {
    setEditing(null);
    router.refresh();
  };

  const nudge = (id: string, direction: 'up' | 'down') =>
    start(async () => {
      await moveReferralCode(id, direction);
      router.refresh();
    });

  return (
    <div className="space-y-3">
      {codes.map((c, i) =>
        editing === c.id ? (
          <CodeEditor key={c.id} code={c} total={codes.length} onDone={done} />
        ) : (
          <div key={c.id} className="flex flex-wrap items-center gap-3.5 rounded-xl border border-line bg-card px-4 py-4 sm:px-5">
            <div className="flex shrink-0 items-center gap-1.5">
              <span className="tab-nums w-6 font-mono text-[9px] tracking-[0.12em] text-mute">{String(i + 1).padStart(2, '0')}</span>
              <div className="flex flex-col gap-0.5">
                <button
                  type="button"
                  disabled={pending || i === 0}
                  onClick={() => nudge(c.id!, 'up')}
                  aria-label={`Move ${c.brand} up`}
                  className="flex h-4 w-5 items-center justify-center rounded text-[9px] leading-none text-mute transition-colors hover:bg-shell hover:text-coral disabled:opacity-25 disabled:hover:bg-transparent disabled:hover:text-mute"
                >
                  ▲
                </button>
                <button
                  type="button"
                  disabled={pending || i === codes.length - 1}
                  onClick={() => nudge(c.id!, 'down')}
                  aria-label={`Move ${c.brand} down`}
                  className="flex h-4 w-5 items-center justify-center rounded text-[9px] leading-none text-mute transition-colors hover:bg-shell hover:text-coral disabled:opacity-25 disabled:hover:bg-transparent disabled:hover:text-mute"
                >
                  ▼
                </button>
              </div>
            </div>
            <span className="text-[14px] font-bold">{c.brand}</span>
            <span className="rounded-full border border-line px-3 py-1 font-mono text-[10px] tracking-[0.1em] text-ink2">{c.code}</span>
            <span className="hidden min-w-0 flex-1 truncate text-[12px] text-mute sm:block">{c.blurb}</span>
            <span className="ml-auto flex shrink-0 gap-3">
              <button type="button" onClick={() => setEditing(c.id!)} className="font-mono text-[9px] tracking-[0.14em] text-sea hover:text-coral">
                EDIT
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  if (!confirm(`Remove ${c.brand} from the Locker?`)) return;
                  start(async () => {
                    await deleteReferralCode(c.id!);
                    router.refresh();
                  });
                }}
                className="font-mono text-[9px] tracking-[0.14em] text-mute hover:text-corald"
              >
                REMOVE
              </button>
            </span>
          </div>
        )
      )}

      {editing === 'new' ? (
        <CodeEditor code={{ brand: '', code: '', url: '', blurb: '', sort: codes.length + 1 }} total={codes.length} onDone={done} />
      ) : (
        <button
          type="button"
          onClick={() => setEditing('new')}
          className="rounded-full border border-dashed border-coral/50 px-5 py-2.5 font-mono text-[9.5px] tracking-[0.16em] text-coral transition-colors hover:bg-coral/10"
        >
          + ADD A CODE
        </button>
      )}
    </div>
  );
}
