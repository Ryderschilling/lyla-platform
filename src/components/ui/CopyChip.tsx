'use client';

import { useState } from 'react';

export function CopyChip({ text, dark = false }: { text: string; dark?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1400);
        } catch {
          /* clipboard blocked — the code is visible anyway */
        }
      }}
      className={`inline-flex items-center gap-2.5 rounded-full border px-4 py-2 font-mono text-[11px] tracking-[0.12em] transition-all duration-300 break-words ${
        copied
          ? 'border-gold bg-gold/15 text-[#9C7220]'
          : dark
            ? 'border-night-line text-night-text hover:border-coral hover:text-coral'
            : 'border-line text-ink hover:border-coral hover:text-coral'
      }`}
      aria-label={`Copy code ${text}`}
    >
      {text}
      <span className="text-[9px] tracking-[0.16em] opacity-70">{copied ? 'COPIED' : 'COPY'}</span>
    </button>
  );
}
