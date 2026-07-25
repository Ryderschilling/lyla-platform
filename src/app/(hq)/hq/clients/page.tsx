import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth';
import { db, schema } from '@/lib/db';
import { and, asc, eq, isNull, sql as dsql } from 'drizzle-orm';
import { chiDay, computeStreaks } from '@/lib/dates';
import { getActiveDaysByUser } from '@/lib/queries';
import { CreateClientForm } from '@/components/hq/CreateClientForm';
import { ClientList } from '@/components/hq/ClientList';
import type { ClientProfile, ClientIntake } from '@/components/hq/ClientModal';

export const metadata: Metadata = { title: 'Clients' };
export const dynamic = 'force-dynamic';

const usd = (cents: number) =>
  `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: cents % 100 === 0 ? 0 : 2, maximumFractionDigits: 2 })}`;

/** Date -> 'YYYY-MM-DD', which is what the date input wants. */
const isoDay = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : null);

const EXPERIENCE_LABEL: Record<string, string> = {
  brand_new: 'Brand new',
  some: 'Some experience',
  consistent: 'Consistent',
  athlete: 'Athlete',
};

const stamp = (d: Date | null) =>
  d
    ? new Intl.DateTimeFormat('en-US', { timeZone: 'America/Chicago', month: 'short', day: 'numeric', year: 'numeric' })
        .format(d)
        .toUpperCase()
    : null;

const EMPTY_INTAKE: ClientIntake = {
  completed: false,
  agreedAt: null,
  agreedVersion: null,
  age: null,
  height: null,
  weightLb: null,
  experience: null,
  daysPerWeek: null,
  goal: '',
  injuries: '',
  equipment: '',
  anythingElse: '',
  coachContext: '',
};

export default async function ClientsPage() {
  const admin = await requireAdmin();
  const [clients, completions, unreadRows, profiles, activeByUser] = await Promise.all([
    db.query.users.findMany({ where: eq(schema.users.role, 'client'), orderBy: asc(schema.users.fullName) }),
    db.query.completions.findMany(),
    db
      .select({ senderId: schema.messages.senderId, n: dsql<number>`count(*)::int` })
      .from(schema.messages)
      .where(and(eq(schema.messages.recipientId, admin.id), isNull(schema.messages.readAt)))
      .groupBy(schema.messages.senderId),
    db.query.clientProfiles.findMany(),
    getActiveDaysByUser(),
  ]);

  const profileByUser = new Map(profiles.map((p) => [p.userId, p]));

  const unread = new Map(unreadRows.filter((r) => r.senderId).map((r) => [r.senderId as string, r.n]));
  const byUser = new Map<string, Set<string>>();
  for (const c of completions) {
    if (!byUser.has(c.userId)) byUser.set(c.userId, new Set());
    byUser.get(c.userId)!.add(chiDay(c.completedAt));
  }

  const rows: ClientProfile[] = clients.map((c) => {
    // streak + last-seen = SHOWING UP; check-in total = workouts finished
    const shown = activeByUser.get(c.id) ?? new Set<string>();
    const days = byUser.get(c.id) ?? new Set<string>();
    const { current, best } = computeStreaks(shown);
    const last = shown.size ? Array.from(shown).sort().pop()! : null;
    const p = profileByUser.get(c.id);
    const intake: ClientIntake = p
      ? {
          completed: !!p.completedAt,
          agreedAt: stamp(p.agreedAt),
          agreedVersion: p.agreedVersion,
          age: p.age,
          height: p.heightIn != null ? `${Math.floor(p.heightIn / 12)}'${p.heightIn % 12}"` : null,
          weightLb: p.weightLb,
          experience: p.experience ? EXPERIENCE_LABEL[p.experience] ?? p.experience : null,
          daysPerWeek: p.daysPerWeek,
          goal: p.goal ?? '',
          injuries: p.injuries ?? '',
          equipment: p.equipment ?? '',
          anythingElse: p.anythingElse ?? '',
          coachContext: p.coachContext ?? '',
        }
      : EMPTY_INTAKE;
    return {
      id: c.id,
      name: c.fullName,
      email: c.email,
      phone: c.phone ?? '',
      notes: c.notes ?? '',
      priceCents: c.monthlyPriceCents,
      active: c.active,
      startedAt: isoDay(c.startedAt),
      streak: current,
      best,
      total: days.size,
      last,
      unread: unread.get(c.id) ?? 0,
      intake,
    };
  });

  const paying = rows.filter((r) => r.active && r.priceCents > 0);
  const mrr = paying.reduce((sum, r) => sum + r.priceCents, 0);

  return (
    <div className="mx-auto max-w-5xl">
      <p className="eyebrow text-coral">Every login, made by hand</p>
      <h1 className="mt-2 font-display text-3xl font-normal">Clients</h1>

      <div className="mt-6 grid items-start gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-2xl border border-line bg-card p-6">
          <p className="font-mono text-[8.5px] tracking-[0.2em] text-coral">CREATE CLIENT LOGIN</p>
          <p className="mt-2 text-[13px] leading-relaxed text-ink2">
            They Venmo&apos;d you → set what they pay → make their login → send them the email + password. Credentials stay with
            them for good.
          </p>
          <div className="mt-5">
            <CreateClientForm />
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-card p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <p className="font-mono text-[8.5px] tracking-[0.2em] text-sea">
              {rows.length} {rows.length === 1 ? 'MEMBER' : 'MEMBERS'}
            </p>
            <p className="tab-nums font-mono text-[8.5px] tracking-[0.16em] text-[#9C7220]">
              {usd(mrr)}/MO · {paying.length} PAYING
            </p>
          </div>
          <p className="mt-1 font-mono text-[7.5px] tracking-[0.12em] text-mute">TAP ANYONE TO OPEN THEIR PROFILE</p>
          {rows.length === 0 ? (
            <p className="mt-4 text-sm text-ink2">Nobody yet. First Venmo, first login — it all starts here.</p>
          ) : (
            <div className="mt-3">
              <ClientList clients={rows} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
