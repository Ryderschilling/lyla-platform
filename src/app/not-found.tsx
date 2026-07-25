import Link from 'next/link';
import { SunMark } from '@/components/ui/marks';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-shell px-6 text-center text-ink">
      <SunMark className="h-10 w-10 text-mute" />
      <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-mute">404 — Off the path</p>
      <h1 className="max-w-[16ch] font-display text-[clamp(30px,6vw,52px)] font-normal leading-[1.02] tracking-tight">
        This page skipped <em className="italic text-coral">leg day.</em>
      </h1>
      <Link
        href="/"
        className="mt-2 rounded-full bg-ink px-6 py-3 font-mono text-[10px] tracking-[0.16em] text-shell transition-colors duration-300 hover:bg-coral"
      >
        BACK TO THE SUNRISE →
      </Link>
    </div>
  );
}
