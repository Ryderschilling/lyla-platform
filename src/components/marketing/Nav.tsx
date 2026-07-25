'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { SunMark } from '../ui/marks';
import { EASE } from '../ui/motion';

const LINKS = [
  { href: '/', label: 'HOME' },
  { href: '/watch', label: 'WATCH' },
  { href: '/locker', label: 'THE LOCKER' },
  { href: '/the-club', label: 'THE CLUB' },
  { href: '/contact', label: 'CONTACT' },
];

export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  /** Home's hero is a full-bleed dark photo — the nav goes light until you scroll off it. */
  const overHero = pathname === '/' && !scrolled;
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      {/*
        Floating nav. The bar NEVER changes size or position — animating width /
        left / height is what makes these stutter, because every frame forces a
        layout pass. Instead the geometry is fixed and only two compositor-safe
        properties move: a translateY on the rail, and the opacity of a pill
        that is painted underneath the content and always occupies the same box.
        Nothing reflows, so it stays smooth even mid-scroll.
      */}
      <header className="pointer-events-none fixed inset-x-0 top-0 z-50">
        <div
          className={`mx-auto max-w-6xl transition-transform duration-[600ms] ease-brand will-change-transform ${
            scrolled ? 'translate-y-3 md:translate-y-4' : 'translate-y-0'
          }`}
        >
          <div className="relative">
            {/* the glass pill — fades in, never moves */}
            <div
              aria-hidden
              className={`absolute inset-0 rounded-full border border-line2 bg-[rgba(247,241,230,0.82)] shadow-[0_22px_50px_-26px_rgba(35,48,41,0.55)] backdrop-blur-xl transition-opacity duration-[600ms] ease-brand ${
                scrolled ? 'opacity-100' : 'opacity-0'
              }`}
            />
            <div className="pointer-events-auto relative flex h-16 items-center gap-5 px-5 md:px-10">
          <Link
            href="/"
            className={`flex items-center gap-2.5 font-display text-[15px] tracking-tight transition-colors duration-500 ${
              overHero ? 'text-night-text' : 'text-ink'
            }`}
          >
            <SunMark className="h-5 w-5 text-coral" />
            Lyla Schilling
          </Link>

          <nav className="ml-auto hidden items-center gap-7 lg:flex">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`font-mono text-[10px] tracking-[0.18em] transition-colors duration-300 ${
                  pathname === l.href
                    ? 'text-coral'
                    : overHero
                      ? 'text-night-sub hover:text-coral'
                      : 'text-ink2 hover:text-coral'
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2.5 lg:ml-6">
            <Link
              href="/login"
              className={`hidden rounded-full border px-4 py-2 font-mono text-[10px] tracking-[0.16em] transition-colors duration-500 hover:border-coral hover:text-coral sm:block ${
                overHero ? 'border-night-line text-night-text' : 'border-line text-ink'
              }`}
            >
              LOG IN
            </Link>
            <Link
              href="/the-club"
              className={`rounded-full px-4 py-2.5 font-mono text-[10px] tracking-[0.16em] transition-colors duration-500 ${
                overHero ? 'bg-coral text-night-bg hover:bg-corald' : 'bg-ink text-shell hover:bg-coral'
              }`}
            >
              JOIN THE CLUB
            </Link>
            <button
              aria-label={open ? 'Close menu' : 'Open menu'}
              onClick={() => setOpen((v) => !v)}
              className="relative flex h-10 w-10 items-center justify-center lg:hidden"
            >
              <span
                className={`absolute h-px w-5 transition-all duration-300 ${overHero && !open ? 'bg-night-text' : 'bg-ink'} ${
                  open ? 'rotate-45' : '-translate-y-[3.5px]'
                }`}
              />
              <span
                className={`absolute h-px w-5 transition-all duration-300 ${overHero && !open ? 'bg-night-text' : 'bg-ink'} ${
                  open ? '-rotate-45' : 'translate-y-[3.5px]'
                }`}
              />
            </button>
          </div>
            </div>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="fixed inset-0 z-40 flex flex-col bg-shell pt-24"
          >
            <nav className="flex flex-col gap-1 px-7">
              {[...LINKS, { href: '/login', label: 'LOG IN' }].map((l, i) => (
                <motion.div
                  key={l.href}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.05 + i * 0.06, ease: EASE }}
                >
                  <Link
                    href={l.href}
                    className={`block border-b border-line2 py-4 font-display text-3xl ${
                      pathname === l.href ? 'text-coral' : 'text-ink'
                    }`}
                  >
                    {l.label.charAt(0) + l.label.slice(1).toLowerCase()}
                  </Link>
                </motion.div>
              ))}
            </nav>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-auto px-7 pb-10 font-mono text-[10px] uppercase tracking-[0.2em] text-mute"
            >
              Progress over perfection · 30A, FL
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
