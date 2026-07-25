import type { Metadata } from 'next';
import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { getUnreadCountForAdmin } from '@/lib/queries';
import { logout } from '@/lib/actions/auth-actions';
import { SunMark } from '@/components/ui/marks';
import { HqRail } from '@/components/hq/HqRail';

export const metadata: Metadata = {
  title: { default: 'Lyla HQ', template: '%s — Lyla HQ' },
  description: 'Her eyes only.',
};
export const dynamic = 'force-dynamic';

export default async function HqLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();
  const unread = await getUnreadCountForAdmin(session.id);

  return (
    <div className="flex min-h-screen flex-col bg-shell text-ink">
      <header className="sticky top-0 z-40 border-b border-line2 bg-[rgba(247,241,230,0.9)] backdrop-blur-xl">
        <div className="flex h-14 items-center gap-4 px-4 md:px-6">
          <Link href="/hq" className="flex items-center gap-2.5 font-mono text-[9.5px] tracking-[0.26em] text-ink">
            <SunMark className="h-4 w-4 text-coral" />
            LYLA HQ
          </Link>
          <span className="rounded-full bg-sandbar px-2.5 py-1 font-mono text-[8px] tracking-[0.16em] text-ink2">HER EYES ONLY</span>
          <div className="ml-auto flex items-center gap-3">
            <Link
              href="/club"
              className="rounded-full border border-line px-3.5 py-2 font-mono text-[9px] tracking-[0.14em] text-ink2 transition-colors duration-300 hover:border-coral hover:text-coral"
            >
              VIEW THE CLUB →
            </Link>
            <form action={logout}>
              <button
                type="submit"
                className="font-mono text-[9px] tracking-[0.14em] text-mute transition-colors duration-300 hover:text-coral"
              >
                SIGN OUT
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:grid lg:grid-cols-[188px_1fr]">
        <HqRail unread={unread} />
        <main className="min-w-0 flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
