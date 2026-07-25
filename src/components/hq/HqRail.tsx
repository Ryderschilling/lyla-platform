'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ITEMS = [
  { href: '/hq', label: 'THIS WEEK' },
  { href: '/hq/clients', label: 'CLIENTS' },
  { href: '/hq/builder', label: 'WORKOUT BUILDER' },
  { href: '/hq/calendar', label: 'LAUNCH CALENDAR' },
  { href: '/hq/reviews', label: 'REVIEWS INBOX' },
  { href: '/hq/messages', label: 'MESSAGES', badge: true },
  { href: '/hq/locker', label: 'THE LOCKER' },
];

export function HqRail({ unread }: { unread: number }) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === '/hq' ? pathname === '/hq' : pathname.startsWith(href));

  return (
    <nav
      aria-label="HQ navigation"
      className="flex gap-1 overflow-x-auto border-b border-line2 p-3 lg:sticky lg:top-14 lg:h-[calc(100vh-56px)] lg:flex-col lg:overflow-y-auto lg:border-b-0 lg:border-r lg:p-3.5"
    >
      {ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`flex shrink-0 items-center gap-2.5 rounded-[10px] px-3 py-2.5 font-mono text-[9.5px] tracking-[0.12em] transition-colors duration-300 ${
            isActive(item.href) ? 'bg-card text-ink shadow-sm' : 'text-ink2 hover:text-ink'
          }`}
        >
          {isActive(item.href) && <span className="h-[5px] w-[5px] shrink-0 rounded-full bg-coral" />}
          {item.label}
          {item.badge && unread > 0 && (
            <span className="ml-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-coral px-1 font-mono text-[8px] text-card">
              {unread}
            </span>
          )}
        </Link>
      ))}
    </nav>
  );
}
