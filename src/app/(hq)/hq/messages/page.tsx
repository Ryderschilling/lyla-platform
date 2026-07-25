import type { Metadata } from 'next';
import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { db, schema } from '@/lib/db';
import { asc, eq, isNull, or, and, desc } from 'drizzle-orm';
import { markThreadRead } from '@/lib/actions/hq-actions';
import { ReplyBox } from '@/components/hq/ReplyBox';
import { AutoRefresh } from '@/components/hq/AutoRefresh';
import { SunMark } from '@/components/ui/marks';

export const metadata: Metadata = { title: 'Messages' };
export const dynamic = 'force-dynamic';

export default async function HqMessagesPage({ searchParams }: { searchParams: { u?: string } }) {
  const admin = await requireAdmin();
  const selected = searchParams.u ?? null;

  const [clients, allMessages] = await Promise.all([
    db.query.users.findMany({ where: eq(schema.users.role, 'client'), orderBy: asc(schema.users.fullName) }),
    db.query.messages.findMany({ orderBy: asc(schema.messages.createdAt) }),
  ]);

  // build thread summaries
  const guestMessages = allMessages.filter((m) => m.senderId === null);
  const threads = clients
    .map((c) => {
      const thread = allMessages.filter(
        (m) => (m.senderId === c.id && m.recipientId === admin.id) || (m.senderId === admin.id && m.recipientId === c.id)
      );
      const last = thread[thread.length - 1] ?? null;
      const unread = thread.filter((m) => m.senderId === c.id && !m.readAt).length;
      return { id: c.id, name: c.fullName, last, unread, count: thread.length };
    })
    .filter((t) => t.count > 0 || t.id === selected)
    .sort((a, b) => (b.last?.createdAt.getTime() ?? 0) - (a.last?.createdAt.getTime() ?? 0));

  const guestUnread = guestMessages.filter((m) => !m.readAt).length;

  // active thread
  const isGuest = selected === 'guest';
  const activeClient = !isGuest && selected ? clients.find((c) => c.id === selected) : null;
  const activeThread = isGuest
    ? guestMessages
    : activeClient
      ? allMessages.filter(
          (m) =>
            (m.senderId === activeClient.id && m.recipientId === admin.id) ||
            (m.senderId === admin.id && m.recipientId === activeClient.id)
        )
      : [];

  // mark viewed thread read
  if (isGuest && guestUnread > 0) await markThreadRead(null);
  else if (activeClient && activeThread.some((m) => m.senderId === activeClient.id && !m.readAt)) {
    await markThreadRead(activeClient.id);
  }

  return (
    <div className="mx-auto max-w-5xl">
      <AutoRefresh seconds={12} />
      <p className="eyebrow text-coral">Every thread, one screen</p>
      <h1 className="mt-2 font-display text-3xl font-normal">Messages</h1>

      <div className="mt-6 grid items-start gap-4 lg:grid-cols-[280px_1fr]">
        {/* threads list */}
        <div className="rounded-2xl border border-line bg-card p-3">
          {threads.length === 0 && guestMessages.length === 0 && (
            <p className="p-4 text-[13px] text-mute">No messages yet. Clients write from the Club; visitors use the contact form.</p>
          )}
          {threads.map((t) => (
            <Link
              key={t.id}
              href={`/hq/messages?u=${t.id}`}
              className={`flex items-center gap-3 rounded-xl px-3.5 py-3 transition-colors ${
                selected === t.id ? 'bg-shell' : 'hover:bg-shell/60'
              }`}
            >
              <span className="h-7 w-7 shrink-0 rounded-full bg-gradient-to-br from-sandbar to-coral" />
              <span className="min-w-0">
                <span className="block truncate text-[13px] font-bold">{t.name}</span>
                <span className="block truncate font-mono text-[8px] tracking-[0.08em] text-mute">
                  {t.last ? t.last.body.slice(0, 34).toUpperCase() : 'NO MESSAGES YET'}
                </span>
              </span>
              {t.unread > 0 && (
                <span className="ml-auto flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-coral px-1 font-mono text-[8px] text-card">
                  {t.unread}
                </span>
              )}
            </Link>
          ))}
          {guestMessages.length > 0 && (
            <Link
              href="/hq/messages?u=guest"
              className={`mt-1 flex items-center gap-3 rounded-xl border-t border-line2 px-3.5 py-3 transition-colors ${
                isGuest ? 'bg-shell' : 'hover:bg-shell/60'
              }`}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sandbar font-mono text-[9px] text-ink2">
                ✉
              </span>
              <span className="min-w-0">
                <span className="block text-[13px] font-bold">Contact form</span>
                <span className="block font-mono text-[8px] tracking-[0.08em] text-mute">VISITORS · NOT MEMBERS YET</span>
              </span>
              {guestUnread > 0 && (
                <span className="ml-auto flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-coral px-1 font-mono text-[8px] text-card">
                  {guestUnread}
                </span>
              )}
            </Link>
          )}
        </div>

        {/* active thread */}
        <div className="rounded-2xl border border-line bg-card">
          {!selected ? (
            <div className="flex flex-col items-center gap-4 px-6 py-20 text-center">
              <SunMark className="h-7 w-7 text-mute" />
              <p className="max-w-[36ch] text-sm text-ink2">Pick a thread. Unread ones wear a coral badge.</p>
            </div>
          ) : (
            <div className="flex flex-col">
              <div className="border-b border-line2 px-5 py-3.5">
                <p className="text-[14px] font-bold">{isGuest ? 'Contact form messages' : activeClient?.fullName ?? 'Unknown'}</p>
                {isGuest && (
                  <p className="mt-0.5 font-mono text-[8px] tracking-[0.1em] text-mute">
                    REPLY BY EMAIL — THESE FOLKS DON&apos;T HAVE CLUB LOGINS YET
                  </p>
                )}
              </div>
              <div className="flex max-h-[52vh] min-h-[240px] flex-col gap-2.5 overflow-y-auto p-5">
                {activeThread.length === 0 && <p className="m-auto text-[13px] text-mute">Nothing here yet — say hey first.</p>}
                {activeThread.map((m) =>
                  m.senderId === admin.id ? (
                    <div key={m.id} className="max-w-[85%] self-end rounded-xl rounded-br-[4px] bg-coral/15 px-3.5 py-2.5 text-[13px] leading-relaxed text-ink">
                      {m.body}
                    </div>
                  ) : (
                    <div key={m.id} className="max-w-[85%] self-start rounded-xl rounded-bl-[4px] border border-line bg-shell px-3.5 py-2.5 text-[13px] leading-relaxed text-ink">
                      {isGuest && (
                        <p className="mb-1 break-words font-mono text-[8px] tracking-[0.1em] text-sea">
                          {(m.guestName ?? 'VISITOR').toUpperCase()} · {m.guestEmail}
                        </p>
                      )}
                      {m.body}
                    </div>
                  )
                )}
              </div>
              <div className="border-t border-line2 p-4">
                {isGuest ? (
                  <p className="text-center font-mono text-[9px] uppercase tracking-[0.16em] text-mute">
                    Tap an email above to reply from your inbox
                  </p>
                ) : (
                  activeClient && <ReplyBox clientId={activeClient.id} />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
