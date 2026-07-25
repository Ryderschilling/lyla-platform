'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { login, type FormState } from '@/lib/actions/auth-actions';

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-full bg-ink py-3.5 font-mono text-[11px] tracking-[0.16em] text-shell transition-colors duration-300 hover:bg-coral disabled:opacity-60"
    >
      {pending ? 'CHECKING…' : 'LOG IN →'}
    </button>
  );
}

const field =
  'w-full rounded-xl border border-line bg-shell px-4 py-3.5 text-sm text-ink outline-none transition-colors duration-300 focus:border-coral';

export function LoginForm({ next, deactivated }: { next?: string; deactivated?: boolean }) {
  const [state, action] = useFormState<FormState, FormData>(login, {});

  return (
    <form action={action} className="space-y-4">
      {deactivated && (
        <p className="rounded-xl border border-coral/40 bg-coral/10 px-4 py-3 text-center text-[13px] text-corald">
          This account is paused. Message Lyla to get back in.
        </p>
      )}
      <div>
        <label htmlFor="l-email" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.18em] text-ink2">
          Email
        </label>
        <input id="l-email" name="email" type="email" required autoComplete="email" placeholder="you@email.com" className={field} />
      </div>
      <div>
        <label htmlFor="l-pass" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.18em] text-ink2">
          Password
        </label>
        <input
          id="l-pass"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
          className={field}
        />
      </div>
      {next && <input type="hidden" name="next" value={next} />}
      {state.error && <p className="text-center text-[13px] text-corald">{state.error}</p>}
      <Submit />
      <p className="pt-1 text-center font-mono text-[9px] uppercase tracking-[0.16em] text-mute">
        Forgot it? Message Lyla — she&apos;ll reset you in a minute
      </p>
    </form>
  );
}
