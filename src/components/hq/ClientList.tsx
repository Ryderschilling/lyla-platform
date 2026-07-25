'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { setClientActive } from '@/lib/actions/hq-actions';
import { ClientModal, money, type ClientProfile } from './ClientModal';

function fmtShort(day: string): string {
  return new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric' })
    .format(new Date(`${day}T12:00:00Z`))
    .toUpperCase();
}

export function ClientList({ clients }: { clients: ClientProfile[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const open = clients.find((c) => c.id === openId) ?? null;

  return (
    <>
      <div className="divide-y divide-line2">
        {clients.map((c) => (
          <ClientRow key={c.id} client={c} onOpen={() => setOpenId(c.id)} />
        ))}
      </div>
      <ClientModal client={open} onClose={() => setOpenId(null)} />
    </>
  );
}

function ClientRow({ client, onOpen }: { client: ClientProfile; onOpen: () => void }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <div className={`group relative py-3.5 ${client.active ? '' : 'opacity-55'}`}>
      {/* full-row hit area, underneath the real controls */}
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Open ${client.name}'s profile`}
        className="absolute -inset-x-3 inset-y-0 z-0 rounded-xl transition-colors duration-300 hover:bg-shell"
      />

      <div className="pointer-events-none relative z-10 flex items-center gap-3.5">
        <span className="h-7 w-7 shrink-0 rounded-full bg-gradient-to-br from-sandbar to-sea" />
        <div className="min-w-0">
          <p className="flex items-center gap-2 truncate text-[13.5px] font-bold">
            <span className="truncate transition-colors duration-300 group-hover:text-coral">{client.name}</span>
            {client.unread > 0 && (
              <Link
                href={`/hq/messages?u=${client.id}`}
                onClick={(e) => e.stopPropagation()}
                className="pointer-events-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-coral px-1 font-mono text-[8px] text-card"
                title={`${client.unread} unread`}
              >
                {client.unread}
              </Link>
            )}
          </p>
          <p className="truncate font-mono text-[8.5px] tracking-[0.08em] text-mute">
            {client.email.toUpperCase()} · {client.last ? `LAST ACTIVE ${fmtShort(client.last)}` : 'NO CHECK-INS YET'}
          </p>
          {client.intake.injuries && (
            <p
              className="mt-1 truncate font-mono text-[8px] tracking-[0.1em] text-corald"
              title={client.intake.injuries}
            >
              ⚑ {client.intake.injuries.toUpperCase()}
            </p>
          )}
          {!client.intake.completed && (
            <p className="mt-1 font-mono text-[8px] tracking-[0.1em] text-mute/70">WELCOME QUESTIONS NOT DONE</p>
          )}
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-3">
          <span className="tab-nums font-mono text-[9px] tracking-[0.1em] text-sea">{money(client.priceCents)}/MO</span>
          <span className="hidden font-mono text-[8.5px] tracking-[0.1em] text-[#9C7220] sm:inline">{client.streak}-DAY</span>
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              start(async () => {
                await setClientActive(client.id, !client.active);
                router.refresh();
              })
            }
            className={`pointer-events-auto rounded-full border px-3 py-1.5 font-mono text-[8px] tracking-[0.14em] transition-colors disabled:opacity-50 ${
              client.active
                ? 'border-line text-mute hover:border-coral hover:text-corald'
                : 'border-sea/50 text-sea hover:border-sea'
            }`}
          >
            {client.active ? 'PAUSE' : 'REACTIVATE'}
          </button>
          <span className="font-mono text-[11px] text-mute transition-colors duration-300 group-hover:text-coral">→</span>
        </div>
      </div>
    </div>
  );
}
