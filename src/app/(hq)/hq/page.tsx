import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { db, schema } from '@/lib/db';
import { and, desc, eq, gte, lte } from 'drizzle-orm';
import { chiDay, addDays, computeStreaks } from '@/lib/dates';
import { getActiveDaysByUser } from '@/lib/queries';

export const dynamic = 'force-dynamic';

const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/** '2026-07-25' -> 'JUL 25' */
function fmtDay(day: string): string {
  return new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric' })
    .format(new Date(`${day}T12:00:00Z`))
    .toUpperCase();
}

const usd = (cents: number) =>
  `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: cents % 100 === 0 ? 0 : 2, maximumFractionDigits: 2 })}`;

export default async function HqDashboard() {
  await requireAdmin();
  const today = chiDay();
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6)); // last 7 days, ending today

  const [clients, completions, leads, scheduled, activeByUser] = await Promise.all([
    db.query.users.findMany({ where: eq(schema.users.role, 'client') }),
    db.query.completions.findMany(),
    db.query.leads.findMany({ orderBy: desc(schema.leads.createdAt) }),
    db.query.workouts.findMany({
      where: and(eq(schema.workouts.published, true), gte(schema.workouts.launchAt, new Date())),
    }),
    getActiveDaysByUser(),
  ]);

  const activeClients = clients.filter((c) => c.active);

  // per-client day sets
  const byUser = new Map<string, Set<string>>();
  for (const c of completions) {
    if (!byUser.has(c.userId)) byUser.set(c.userId, new Set());
    byUser.get(c.userId)!.add(chiDay(c.completedAt));
  }

  // weekly show-up: distinct active clients who completed something each day
  const daily = weekDays.map((d) => {
    let n = 0;
    for (const c of activeClients) if (byUser.get(c.id)?.has(d)) n++;
    return { day: d, n };
  });
  const showedThisWeek = activeClients.filter((c) => weekDays.some((d) => byUser.get(c.id)?.has(d))).length;
  const showUpPct = activeClients.length ? Math.round((showedThisWeek / activeClients.length) * 100) : 0;
  const maxDaily = Math.max(1, ...daily.map((d) => d.n));

  // money — only active members with a price on them count toward MRR
  const paying = activeClients.filter((c) => c.monthlyPriceCents > 0);
  const mrr = paying.reduce((sum, c) => sum + c.monthlyPriceCents, 0);
  const avgPrice = paying.length ? Math.round(mrr / paying.length) : 0;
  const comped = activeClients.length - paying.length;

  // per-client rows — streak and "last seen" track SHOWING UP; total tracks workouts finished
  const rows = activeClients
    .map((c) => {
      const shown = activeByUser.get(c.id) ?? new Set<string>();
      const days = byUser.get(c.id) ?? new Set<string>();
      const { current, best } = computeStreaks(shown);
      const last = shown.size ? Array.from(shown).sort().pop()! : null;
      const daysSince = last ? Math.round((Date.parse(`${today}T12:00:00Z`) - Date.parse(`${last}T12:00:00Z`)) / 86400000) : null;
      return { id: c.id, name: c.fullName, current, best, total: days.size, last, daysSince };
    })
    .sort((a, b) => b.current - a.current);

  const fading = rows.filter((r) => r.daysSince === null || r.daysSince >= 3);

  const hourCT = Number(
    new Intl.DateTimeFormat('en-US', { timeZone: 'America/Chicago', hour: 'numeric', hour12: false }).format(new Date())
  );
  const greeting = hourCT < 12 ? 'Morning' : hourCT < 17 ? 'Afternoon' : 'Evening';

  return (
    <div className="mx-auto max-w-5xl">
      <p className="eyebrow text-coral">This week in the Club</p>
      <h1 className="mt-2 font-display text-3xl font-normal">{greeting}, Lyla.</h1>

      {/* money bar */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-gold/45 bg-gradient-to-br from-gold/[0.14] to-coral/[0.06]">
        <div className="grid gap-6 p-6 sm:grid-cols-[1.2fr_1fr_1fr] sm:items-end">
          <div>
            <p className="font-mono text-[8.5px] tracking-[0.2em] text-[#9C7220]">MONTHLY RECURRING REVENUE</p>
            <p className="tab-nums mt-1.5 font-display text-[42px] leading-none">{usd(mrr)}</p>
            <p className="mt-2 font-mono text-[8.5px] tracking-[0.12em] text-ink2">
              {paying.length} PAYING {paying.length === 1 ? 'MEMBER' : 'MEMBERS'}
              {comped > 0 ? ` · ${comped} COMPED` : ''}
            </p>
          </div>
          <div>
            <p className="font-mono text-[8.5px] tracking-[0.18em] text-mute">AVERAGE PRICE</p>
            <p className="tab-nums mt-1 font-mono text-2xl">{usd(avgPrice)}</p>
            <p className="font-mono text-[8px] tracking-[0.12em] text-mute">PER MEMBER / MO</p>
          </div>
          <div>
            <p className="font-mono text-[8.5px] tracking-[0.18em] text-mute">ON THIS PACE</p>
            <p className="tab-nums mt-1 font-mono text-2xl">{usd(mrr * 12)}</p>
            <p className="font-mono text-[8px] tracking-[0.12em] text-mute">PER YEAR</p>
          </div>
        </div>
      </div>

      {/* stat cards */}
      <div className="mt-6 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-line bg-card p-5">
          <p className="font-mono text-[8.5px] tracking-[0.2em] text-coral">SHOW-UP RATE</p>
          <p className="tab-nums mt-2 font-mono text-4xl">
            {showUpPct}
            <span className="text-base text-sea">%</span>
          </p>
          <p className="mt-1 font-mono text-[8.5px] tracking-[0.12em] text-mute">
            {showedThisWeek} OF {activeClients.length} CHECKED IN · 7 DAYS
          </p>
          <div className="mt-3 flex h-11 items-end gap-1">
            {daily.map((d) => (
              <span
                key={d.day}
                className={`flex-1 rounded-t ${d.n > 0 ? 'bg-coral' : 'bg-sandbar'}`}
                style={{ height: `${Math.max(10, (d.n / maxDaily) * 100)}%` }}
              />
            ))}
          </div>
          <div className="mt-1 flex justify-between font-mono text-[7.5px] tracking-[0.1em] text-mute">
            {daily.map((d) => (
              <span key={d.day} className="flex-1 text-center">
                {DOW[new Date(`${d.day}T12:00:00Z`).getUTCDay()]}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-card p-5">
          <p className="font-mono text-[8.5px] tracking-[0.2em] text-sea">MEMBERS</p>
          <p className="tab-nums mt-2 font-mono text-4xl">{activeClients.length}</p>
          <p className="mt-1 font-mono text-[8.5px] tracking-[0.12em] text-mute">
            {clients.length - activeClients.length} PAUSED
          </p>
          <Link href="/hq/clients" className="mt-4 inline-block font-mono text-[9px] tracking-[0.14em] text-sea hover:text-coral">
            + CREATE CLIENT LOGIN
          </Link>
        </div>

        <div className="rounded-2xl border border-line bg-card p-5">
          <p className="font-mono text-[8.5px] tracking-[0.2em] text-[#9C7220]">THE LIST</p>
          <p className="tab-nums mt-2 font-mono text-4xl">{leads.length}</p>
          <p className="mt-1 font-mono text-[8.5px] tracking-[0.12em] text-mute">FREE-WEEK EMAILS CAPTURED</p>
          <div className="mt-3 space-y-1">
            {leads.slice(0, 2).map((l) => (
              <p key={l.id} className="truncate font-mono text-[9px] text-ink2">
                {l.email}
              </p>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-card p-5">
          <p className="font-mono text-[8.5px] tracking-[0.2em] text-coral">SCHEDULED</p>
          <p className="tab-nums mt-2 font-mono text-4xl">{scheduled.length}</p>
          <p className="mt-1 font-mono text-[8.5px] tracking-[0.12em] text-mute">DROPS QUEUED &amp; READY</p>
          <Link href="/hq/builder/new" className="mt-4 inline-block font-mono text-[9px] tracking-[0.14em] text-sea hover:text-coral">
            + BUILD A WORKOUT
          </Link>
        </div>
      </div>

      {/* fading flags */}
      {fading.length > 0 && (
        <div className="mt-6 rounded-2xl border border-coral/40 bg-coral/[0.06] p-5">
          <p className="font-mono text-[8.5px] tracking-[0.2em] text-corald">FADING — NO CHECK-IN 3+ DAYS</p>
          <div className="mt-3 flex flex-wrap gap-2.5">
            {fading.map((r) => (
              <Link
                key={r.id}
                href={`/hq/messages?u=${r.id}`}
                className="flex items-center gap-2.5 rounded-full border border-coral/40 bg-card px-4 py-2 text-[13px] font-bold transition-colors duration-300 hover:border-coral"
              >
                {r.name}
                <span className="font-mono text-[8px] tracking-[0.12em] text-corald">
                  {r.last ? `LAST SEEN ${r.daysSince}D AGO` : 'NEVER CHECKED IN'} · CHECK IN ↗
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* streak table */}
      <div className="mt-6 rounded-2xl border border-line bg-card p-5">
        <p className="font-mono text-[8.5px] tracking-[0.2em] text-coral">CLIENT STREAKS</p>
        {rows.length === 0 ? (
          <p className="mt-4 text-sm text-ink2">No clients yet — create the first login and this fills itself in.</p>
        ) : (
          <div className="mt-3 divide-y divide-line2">
            {rows.map((r) => (
              <div key={r.id} className="flex items-center gap-4 py-3">
                <span className="h-7 w-7 shrink-0 rounded-full bg-gradient-to-br from-sandbar to-coral" />
                <div className="min-w-0">
                  <p className="truncate text-[13.5px] font-bold">{r.name}</p>
                  <p className="font-mono text-[8px] tracking-[0.12em] text-mute">
                    {r.last ? `LAST ACTIVE ${fmtDay(r.last)}` : 'NO CHECK-INS YET'}
                  </p>
                </div>
                <div className="ml-auto flex shrink-0 items-center gap-5 text-right">
                  <span className="font-mono text-[9px] tracking-[0.1em] text-[#9C7220]">
                    {r.current}-DAY STREAK
                  </span>
                  <span className="hidden font-mono text-[9px] tracking-[0.1em] text-mute sm:inline">BEST {r.best}</span>
                  <span className="hidden font-mono text-[9px] tracking-[0.1em] text-mute sm:inline">{r.total} TOTAL</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
