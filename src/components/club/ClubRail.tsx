'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ITEMS = [
  { href: '/club', label: "TODAY'S WOD" },
  { href: '/club/past', label: 'PAST WORKOUTS' },
  { href: '/club/progress', label: 'MY PROGRESS' },
  { href: '/club/messages', label: 'MESSAGE LYLA', badge: true },
  { href: '/club/review', label: 'LEAVE A REVIEW' },
];
const SECONDARY = [
  { href: '/club/locker', label: 'THE LOCKER' },
  { href: '/club/account', label: 'ACCOUNT' },
];

export function ClubRail({ unread, isAdmin }: { unread: number; isAdmin: boolean }) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === '/club' ? pathname === '/club' : pathname.startsWith(href));

  const link = (item: { href: string; label: string; badge?: boolean }) => (
    <Link
      key={item.href}
      href={item.href}
      className={`flex shrink-0 items-center gap-2.5 rounded-[10px] px-3 py-2.5 font-mono text-[9.5px] tracking-[0.12em] transition-colors duration-300 ${
        isActive(item.href) ? 'bg-night-card2 text-night-text' : 'text-night-sub hover:text-night-text'
      }`}
    >
      {isActive(item.href) && <span className="h-[5px] w-[5px] shrink-0 rounded-full bg-coral" />}
      {item.label}
      {item.badge && unread > 0 && (
        <span className="ml-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-coral px-1 font-mono text-[8px] text-night-bg">
          {unread}
        </span>
      )}
    </Link>
  );

  return (
    <nav
      aria-label="Club navigation"
      className="flex gap-1 overflow-x-auto border-b border-night-line p-3 lg:sticky lg:top-14 lg:h-[calc(100vh-56px)] lg:flex-col lg:overflow-y-auto lg:border-b-0 lg:border-r lg:p-3.5"
    >
      {ITEMS.map(link)}
      <span className="hidden h-px bg-night-line lg:my-3 lg:block" />
      {SECONDARY.map(link)}
      {isAdmin && (
        <Link
          href="/hq"
          className="flex shrink-0 items-center gap-2.5 rounded-[10px] px-3 py-2.5 font-mono text-[9.5px] tracking-[0.12em] text-gold transition-colors duration-300 hover:text-night-text"
        >
          → LYLA HQ
        </Link>
      )}
    </nav>
  );
}
