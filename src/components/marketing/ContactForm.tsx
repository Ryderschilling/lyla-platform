'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { sendContactMessage, type FormState } from '@/lib/actions/public-actions';

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-ink px-7 py-3.5 font-mono text-[11px] tracking-[0.14em] text-shell transition-colors duration-300 hover:bg-coral disabled:opacity-60"
    >
      {pending ? 'SENDING…' : 'SEND IT →'}
    </button>
  );
}

const field =
  'w-full rounded-xl border border-line bg-card px-4 py-3.5 text-sm text-ink outline-none transition-colors duration-300 focus:border-coral';

export function ContactForm() {
  const [state, action] = useFormState<FormState, FormData>(sendContactMessage, {});

  if (state.ok) {
    return (
      <div className="rounded-2xl border border-gold/50 bg-gold/10 p-8 text-center">
        <p className="font-display text-xl">Got it. Talk soon.</p>
        <p className="mt-2 text-sm text-ink2">Your note is sitting in Lyla&apos;s HQ right now — she&apos;ll write you back at the email you left.</p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="c-name" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.18em] text-ink2">
            Name
          </label>
          <input id="c-name" name="name" required maxLength={80} placeholder="Your name" className={field} />
        </div>
        <div>
          <label htmlFor="c-email" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.18em] text-ink2">
            Email
          </label>
          <input id="c-email" name="email" type="email" required placeholder="you@email.com" className={field} />
        </div>
      </div>
      <div>
        <label htmlFor="c-msg" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.18em] text-ink2">
          Message
        </label>
        <textarea
          id="c-msg"
          name="message"
          required
          rows={5}
          maxLength={4000}
          placeholder="Where are you at, and where do you want to be?"
          className={`${field} resize-y`}
        />
      </div>
      <input type="text" name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <div className="flex items-center gap-4">
        <Submit />
        {state.error && <p className="text-sm text-corald">{state.error}</p>}
      </div>
    </form>
  );
}
