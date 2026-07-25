'use client';

import { useRef, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { createClient, type FormState } from '@/lib/actions/hq-actions';

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-coral px-5 py-2.5 font-mono text-[10px] tracking-[0.16em] text-card transition-colors duration-300 hover:bg-corald disabled:opacity-60"
    >
      {pending ? 'CREATING…' : 'CREATE LOGIN →'}
    </button>
  );
}

const field =
  'w-full rounded-xl border border-line bg-shell px-3.5 py-3 text-sm text-ink outline-none transition-colors duration-300 focus:border-coral';

function generatePassword(): string {
  const words = ['sunrise', 'progress', 'gulf', 'golden', 'palm', 'sandbar', 'sweat', 'thirty-a'];
  const w = words[Math.floor(Math.random() * words.length)];
  const n = Math.floor(100 + Math.random() * 900);
  return `${w}-${n}-club`;
}

const PRESETS = ['29', '39', '49'];

export function CreateClientForm() {
  const [state, action] = useFormState<FormState, FormData>(createClient, {});
  const [pw, setPw] = useState('');
  const [price, setPrice] = useState('39');
  const formRef = useRef<HTMLFormElement>(null);
  const [creds, setCreds] = useState<{ email: string; pw: string } | null>(null);
  const [copied, setCopied] = useState(false);

  return (
    <div>
      <form
        ref={formRef}
        action={(fd) => {
          const email = String(fd.get('email') ?? '');
          const password = String(fd.get('password') ?? '');
          setCreds({ email, pw: password });
          return action(fd);
        }}
        className="space-y-3"
      >
        <input name="fullName" required placeholder="Full name" maxLength={80} className={field} />
        <input name="email" type="email" required placeholder="their@email.com" className={field} />
        <div className="flex gap-2">
          <input
            name="password"
            required
            minLength={8}
            placeholder="Password (8+ chars)"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            className={field}
          />
          <button
            type="button"
            onClick={() => setPw(generatePassword())}
            className="shrink-0 rounded-xl border border-line px-3.5 font-mono text-[9px] tracking-[0.12em] text-ink2 transition-colors hover:border-coral hover:text-coral"
          >
            GENERATE
          </button>
        </div>

        <div className="rounded-xl border border-line bg-shell p-3.5">
          <label htmlFor="new-client-price" className="font-mono text-[8.5px] tracking-[0.18em] text-sea">
            WHAT THEY PAY / MONTH
          </label>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <div className="relative flex-1">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-[13px] text-mute">$</span>
              <input
                id="new-client-price"
                name="price"
                inputMode="decimal"
                value={price}
                onChange={(e) => setPrice(e.target.value.replace(/[^0-9.]/g, ''))}
                placeholder="39"
                className={`${field} tab-nums bg-card pl-7 font-mono`}
              />
            </div>
            {PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPrice(p)}
                aria-pressed={price === p}
                className={`shrink-0 rounded-full border px-3.5 py-2 font-mono text-[9px] tracking-[0.12em] transition-colors ${
                  price === p ? 'border-coral bg-coral/10 text-corald' : 'border-line text-ink2 hover:border-coral hover:text-coral'
                }`}
              >
                ${p}
              </button>
            ))}
          </div>
          <p className="mt-2 font-mono text-[8px] tracking-[0.1em] text-mute">$0 = COMPED · COUNTS TOWARD MONTHLY REVENUE IN HQ</p>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <Submit />
          {state.error && <p className="text-[13px] text-corald">{state.error}</p>}
        </div>
      </form>

      {state.ok && creds && (
        <div className="mt-4 rounded-xl border border-gold/50 bg-gold/10 p-4">
          <p className="font-mono text-[8.5px] tracking-[0.18em] text-[#9C7220]">LOGIN CREATED — SEND THEM THIS</p>
          <p className="mt-2 break-words font-mono text-[12px] leading-relaxed text-ink">
            club login → {typeof window !== 'undefined' ? window.location.origin : ''}/login
            <br />
            email: {creds.email}
            <br />
            password: {creds.pw}
          </p>
          <button
            type="button"
            onClick={async () => {
              const text = `Welcome to The Progress Club!! 🌅\n\nlog in here: ${window.location.origin}/login\nemail: ${creds.email}\npassword: ${creds.pw}\n\nfirst workout drops at 5am. see you in the club — Lyla`;
              try {
                await navigator.clipboard.writeText(text);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              } catch {}
            }}
            className="mt-3 rounded-full border border-line bg-card px-4 py-2 font-mono text-[9px] tracking-[0.14em] text-ink transition-colors hover:border-coral hover:text-coral"
          >
            {copied ? 'COPIED ✓' : 'COPY WELCOME TEXT'}
          </button>
        </div>
      )}
    </div>
  );
}
