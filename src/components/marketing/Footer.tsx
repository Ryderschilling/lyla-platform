import Link from 'next/link';
import { SunMark } from '../ui/marks';
import { EmailCapture } from './EmailCapture';
import { Reveal } from '../ui/motion';

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-ink text-shell">
      <div className="mx-auto max-w-6xl px-5 py-20 md:px-10 md:py-28">
        <Reveal>
          <div className="flex flex-col items-center text-center">
            <SunMark className="h-9 w-9 text-coral" />
            <h2 className="mt-7 max-w-[16ch] font-display text-[clamp(34px,6vw,64px)] font-normal leading-[1.02] tracking-tight">
              See you in <em className="italic text-coral">the Club.</em>
            </h2>
            <p className="mt-5 max-w-md text-sm text-night-sub">
              Not ready to join? Start with the free week — seven real workouts, zero pressure.
            </p>
            <div className="mt-8 w-full max-w-md">
              <EmailCapture source="footer" dark />
            </div>
          </div>
        </Reveal>

        <div className="mt-16 flex flex-col items-center justify-between gap-8 border-t border-night-line pt-10 md:mt-24 md:flex-row">
          <div className="flex items-center gap-2.5 font-display text-[15px]">
            <SunMark className="h-5 w-5 text-coral" />
            Lyla Schilling
          </div>
          <nav className="flex flex-wrap items-center justify-center gap-x-7 gap-y-3">
            {[
              { href: '/watch', label: 'WATCH' },
              { href: '/locker', label: 'THE LOCKER' },
              { href: '/the-club', label: 'THE CLUB' },
              { href: '/contact', label: 'CONTACT' },
              { href: '/login', label: 'LOG IN' },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="font-mono text-[10px] tracking-[0.18em] text-night-sub transition-colors duration-300 hover:text-coral"
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-5">
            <a
              href="https://instagram.com/lyla_schilling"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[10px] tracking-[0.18em] text-night-sub transition-colors duration-300 hover:text-coral"
            >
              INSTAGRAM
            </a>
            <a
              href="mailto:hello@lylaschilling.com"
              className="font-mono text-[10px] tracking-[0.18em] text-night-sub transition-colors duration-300 hover:text-coral"
            >
              EMAIL
            </a>
          </div>
        </div>

        <p className="mt-10 text-center font-mono text-[9px] uppercase tracking-[0.22em] text-night-sub/60">
          © {new Date().getFullYear()} Lyla Schilling · The Progress Club · Santa Rosa Beach, FL · Progress over perfection
        </p>
      </div>
    </footer>
  );
}
