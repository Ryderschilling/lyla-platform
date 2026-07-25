import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { AGREEMENT_VERSION } from '@/lib/legal';
import { getUserStreak, getAdmin, touchActiveDay } from '@/lib/queries';
import { db, schema } from '@/lib/db';
import { and, eq, isNull } from 'drizzle-orm';
import { sql as dsql } from 'drizzle-orm';
import { SunMark, RiseMark } from '@/components/ui/marks';
import { ClubRail } from '@/components/club/ClubRail';

export const metadata: Metadata = {
  title: { default: "The Progress Club", template: '%s — The Progress Club' },
  description: "Members' training room — The Progress Club.",
  icons: {
    icon: [
      { url: '/club-favicon.svg', type: 'image/svg+xml' },
      { url: '/club-favicon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/club-favicon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/club-apple-touch-icon.png', sizes: '180x180' }],
  },
  manifest: '/club.webmanifest',
};

export const viewport: Viewport = { themeColor: '#141E1A', width: 'device-width', initialScale: 1 };
export const dynamic = 'force-dynamic';

export default async function ClubLayout({ children }: { children: React.ReactNode }) {
  const session = await requireUser();

  // Showing up is the streak. Stamped here (not in the login action) because the
  // session cookie lasts 30 days — a member who never signs out would otherwise
  // never fire another login. Idempotent per Chicago day, so every club page view
  // is safe. Runs BEFORE the /welcome redirect so day one still counts even if
  // they bail out of the wizard.
  if (session.role === 'client') await touchActiveDay(session.id);

  // First login (or a bumped agreement version) → welcome questions first.
  // /welcome lives outside this route group, so there is no redirect loop.
  if (session.role === 'client') {
    const profile = await db.query.clientProfiles.findFirst({
      where: eq(schema.clientProfiles.userId, session.id),
      columns: { completedAt: true, agreedVersion: true },
    });
    if (!profile?.completedAt || profile.agreedVersion !== AGREEMENT_VERSION) redirect('/welcome');
  }

  const [{ current }, admin] = await Promise.all([getUserStreak(session.id), getAdmin()]);

  let unread = 0;
  if (admin) {
    const [row] = await db
      .select({ n: dsql<number>`count(*)::int` })
      .from(schema.messages)
      .where(and(eq(schema.messages.recipientId, session.id), isNull(schema.messages.readAt)));
    unread = row?.n ?? 0;
  }

  const initial = (session.name || session.email || '?').trim().charAt(0).toUpperCase();

  return (
    <div className="theme-dark flex min-h-screen flex-col bg-night-bg text-night-text">
      {/* top bar */}
      <header className="sticky top-0 z-40 border-b border-night-line bg-[rgba(20,30,26,0.92)] backdrop-blur-xl">
        <div className="flex h-14 items-center gap-3.5 px-4 md:px-6">
          <Link href="/club" className="flex items-center gap-2.5 font-mono text-[9.5px] tracking-[0.26em] text-night-text">
            <SunMark className="h-4 w-4 text-coral" />
            <span className="hidden sm:inline">THE PROGRESS CLUB</span>
            <span className="sm:hidden">THE CLUB</span>
          </Link>
          {/* A streak of 0 is a real state, not a bug — never dress it up as DAY 0. */}
          <span
            className={`ml-auto flex items-center gap-2 whitespace-nowrap rounded-full border px-3 py-1.5 font-mono text-[9px] tracking-[0.18em] ${
              current > 0 ? 'border-gold/35 text-gold' : 'border-night-line text-night-sub'
            }`}
          >
            <RiseMark className="h-3 w-3" />
            {current > 0 ? `DAY ${current}` : 'DAY 1 STARTS TODAY'}
          </span>
          <Link
            href="/club/account"
            aria-label="Account"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-night-line bg-gradient-to-br from-coral to-gold font-mono text-[11px] text-night-bg"
          >
            {initial}
          </Link>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:grid lg:grid-cols-[196px_1fr]">
        <ClubRail unread={unread} isAdmin={session.role === 'admin'} />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
