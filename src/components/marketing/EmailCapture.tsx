'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { subscribeLead, type FormState } from '@/lib/actions/public-actions';

function SubmitBtn({ dark }: { dark?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`shrink-0 whitespace-nowrap rounded-full px-5 py-2.5 font-mono text-[10px] tracking-[0.14em] transition-all duration-300 disabled:opacity-60 ${
        dark ? 'bg-coral text-night-bg hover:bg-corald' : 'bg-ink text-shell hover:bg-coral'
      }`}
    >
      {pending ? 'SENDING…' : 'GET A FREE WEEK'}
    </button>
  );
}

/**
 * The list engine: trades a free week of workouts for an email.
 * Writes to `leads` — Lyla's list, forever.
 */
export function EmailCapture({ source, dark = false }: { source: string; dark?: boolean }) {
  const [state, action] = useFormState<FormState, FormData>(subscribeLead, {});

  if (state.ok) {
    return (
      <div
        className={`flex items-center justify-center gap-3 rounded-full border px-6 py-4 ${
          dark ? 'border-gold/45 bg-gold/15 backdrop-blur-md' : 'border-gold/50 bg-gold/10'
        }`}
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-gold">
          You&apos;re in — 7 workouts headed to your inbox
        </span>
      </div>
    );
  }

  return (
    <form action={action} className="w-full">
      <div
        className={`flex items-center gap-2 rounded-full border p-1.5 pl-5 ${
          dark ? 'border-white/20 bg-white/10 backdrop-blur-md' : 'border-line bg-card'
        }`}
      >
        <input
          type="email"
          name="email"
          required
          placeholder="your@email.com"
          className={`w-full bg-transparent text-sm outline-none ${dark ? 'text-night-text' : 'text-ink'}`}
          aria-label="Email address"
        />
        <input type="text" name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
        <input type="hidden" name="source" value={source} />
        <SubmitBtn dark={dark} />
      </div>
      <p className={`mt-3 text-center font-mono text-[9px] uppercase tracking-[0.18em] ${dark ? 'text-night-sub' : 'text-mute'}`}>
        {state.error ? <span className="text-coral">{state.error}</span> : '7 free workouts · straight to your inbox · no spam, just sweat'}
      </p>
    </form>
  );
}
