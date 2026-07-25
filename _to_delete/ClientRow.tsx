'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { setClientActive, resetClientPassword } from '@/lib/actions/hq-actions';

type Client = { id: string; name: string; email: string; active: boolean; streak: number; last: string | null; unread: number };

export function ClientRow({ client }: { client: Client }) {
  const [pending, start] = useTransition();
  const [resetting, setResetting] = useState(false);
  const [newPw, setNewPw] = useState('');
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className={`py-3.5 ${client.active ? '' : 'opacity-55'}`}>
      <div className="flex items-center gap-3.5">
        <span className="h-7 w-7 shrink-0 rounded-full bg-gradient-to-br from-sandbar to-sea" />
        <div className="min-w-0">
          <p className="flex items-center gap-2 truncate text-[13.5px] font-bold">
            {client.name}
            {client.unread > 0 && (
              <Link
                href={`/hq/messages?u=${client.id}`}
                className="flex h-4 min-w-4 items-center justify-center rounded-full bg-coral px-1 font-mono text-[8px] text-card"
                title={`${client.unread} unread`}
              >
                {client.unread}
              </Link>
            )}
          </p>
          <p className="truncate font-mono text-[8.5px] tracking-[0.08em] text-mute">
            {client.email.toUpperCase()} ·{' '}
            {client.last
              ? `LAST ACTIVE ${new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric' }).format(new Date(`${client.last}T12:00:00Z`)).toUpperCase()}`
              : 'NO CHECK-INS YET'}
          </p>
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-3">
          <span className="font-mono text-[8.5px] tracking-[0.1em] text-[#9C7220]">{client.streak}-DAY</span>
          <Link
            href={`/hq/messages?u=${client.id}`}
            aria-label={`Message ${client.name}`}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-line text-[10px] text-ink2 transition-colors hover:border-coral hover:text-coral"
          >
            ✉
          </Link>
          <button
            type="button"
            onClick={() => {
              setResetting((v) => !v);
              setDone(null);
              setError(null);
            }}
            className="font-mono text-[8px] tracking-[0.12em] text-ink2 underline decoration-line underline-offset-2 hover:text-coral"
          >
            RESET PW
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => start(async () => setClientActive(client.id, !client.active))}
            className={`rounded-full border px-3 py-1.5 font-mono text-[8px] tracking-[0.14em] transition-colors disabled:opacity-50 ${
              client.active
                ? 'border-line text-mute hover:border-coral hover:text-corald'
                : 'border-sea/50 text-sea hover:border-sea'
            }`}
          >
            {client.active ? 'PAUSE' : 'REACTIVATE'}
          </button>
        </div>
      </div>

      {resetting && (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-line bg-shell p-3">
          <input
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
            placeholder="New password (8+ chars)"
            className="min-w-0 flex-1 rounded-lg border border-line bg-card px-3 py-2 text-sm outline-none focus:border-coral"
          />
          <button
            type="button"
            disabled={pending || newPw.length < 8}
            onClick={() =>
              start(async () => {
                const res = await resetClientPassword(client.id, newPw);
                if (res.ok) {
                  setDone(newPw);
                  setNewPw('');
                  setResetting(false);
                  setError(null);
                } else setError(res.error ?? 'Try again');
              })
            }
            className="rounded-full bg-ink px-4 py-2 font-mono text-[8.5px] tracking-[0.14em] text-shell transition-colors hover:bg-coral disabled:opacity-40"
          >
            SET
          </button>
          {error && <p className="w-full text-[12px] text-corald">{error}</p>}
        </div>
      )}
      {done && (
        <p className="mt-2 break-words font-mono text-[9px] tracking-[0.1em] text-[#9C7220]">
          NEW PASSWORD SET → SEND THEM: {done}
        </p>
      )}
    </div>
  );
}
