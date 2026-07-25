/**
 * Brand hardware ONLY: nav/footer logo, favicon/PWA, streak chip,
 * daily-drop stamp, empty states. Never decorative page art.
 */
export function SunMark({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" className={className} aria-hidden>
      <circle cx="50" cy="50" r="19.5" />
      <line x1="81" y1="50" x2="97" y2="50" />
      <line x1="80.7" y1="67.8" x2="88.1" y2="72" />
      <line x1="67.8" y1="80.7" x2="72" y2="88.1" />
      <line x1="50" y1="81" x2="50" y2="97" />
      <line x1="32.3" y1="80.7" x2="28" y2="88.1" />
      <line x1="19.3" y1="67.8" x2="11.9" y2="72" />
      <line x1="3" y1="50" x2="19" y2="50" />
      <line x1="19.3" y1="32.3" x2="11.9" y2="28" />
      <line x1="32.3" y1="19.3" x2="28" y2="11.9" />
      <line x1="50" y1="19" x2="50" y2="3" />
      <line x1="67.8" y1="19.3" x2="72" y2="11.9" />
      <line x1="80.7" y1="32.3" x2="88.1" y2="28" />
    </svg>
  );
}

export function RiseMark({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 80" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className={className} aria-hidden>
      <path d="M22 70 A28 28 0 0 1 78 70 Z" fill="currentColor" stroke="none" />
      <line x1="4" y1="70" x2="96" y2="70" />
      <line x1="50" y1="34" x2="50" y2="22" />
      <line x1="28" y1="42" x2="20" y2="34" />
      <line x1="72" y1="42" x2="80" y2="34" />
    </svg>
  );
}

/** Inline play triangle — SVG, never a unicode glyph (emoji rendering trap). */
export function PlayGlyph({ className = 'w-3 h-3' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M8 5.5v13l11-6.5-11-6.5z" />
    </svg>
  );
}
