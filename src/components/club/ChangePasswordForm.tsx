'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { changePassword, type FormState } from '@/lib/actions/auth-actions';

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-coral px-5 py-2.5 font-mono text-[10px] tracking-[0.16em] text-night-bg transition-all duration-300 hover:brightness-110 disabled:opacity-60"
    >
      {pending ? 'SAVING…' : 'UPDATE PASSWORD'}
    </button>
  );
}

const field =
  'w-full rounded-xl border border-night-line bg-night-bg px-4 py-3 text-sm text-night-text outline-none transition-colors duration-300 focus:border-coral/60';

export function ChangePasswordForm() {
  const [state, action] = useFormState<FormState, FormData>(changePassword, {});

  return (
    <form action={action} className="space-y-3.5">
      <div>
        <label htmlFor="pw-cur" className="mb-1.5 block font-mono text-[9px] uppercase tracking-[0.16em] text-night-sub">
          Current password
        </label>
        <input id="pw-cur" name="current" type="password" required autoComplete="current-password" className={field} />
      </div>
      <div>
        <label htmlFor="pw-new" className="mb-1.5 block font-mono text-[9px] uppercase tracking-[0.16em] text-night-sub">
          New password (8+ characters)
        </label>
        <input id="pw-new" name="next" type="password" required minLength={8} autoComplete="new-password" className={field} />
      </div>
      <div className="flex items-center gap-4 pt-1">
        <Submit />
        {state.ok && <p className="font-mono text-[9.5px] tracking-[0.14em] text-gold">DONE — NEW PASSWORD LIVE</p>}
        {state.error && <p className="text-[13px] text-coral">{state.error}</p>}
      </div>
    </form>
  );
}
