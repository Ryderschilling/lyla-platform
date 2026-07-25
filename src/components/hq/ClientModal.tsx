'use client';

import Link from 'next/link';
import { useEffect, useState, useTransition } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { EASE } from '@/components/ui/motion';
import { updateClient, deleteClient, resetClientPassword, updateClientCoaching } from '@/lib/actions/hq-actions';

/** What the member told us on first login. Read-only here except the coaching fields. */
export type ClientIntake = {
  completed: boolean;
  agreedAt: string | null; // display string
  agreedVersion: string | null;
  age: number | null;
  height: string | null; // 5'6"
  weightLb: number | null;
  experience: string | null; // already humanised
  daysPerWeek: number | null;
  goal: string;
  injuries: string;
  equipment: string;
  anythingElse: string;
  coachContext: string;
};

export type ClientProfile = {
  id: string;
  name: string;
  email: string;
  phone: string;
  notes: string;
  priceCents: number;
  active: boolean;
  startedAt: string | null; // YYYY-MM-DD
  streak: number;
  best: number;
  total: number;
  last: string | null; // YYYY-MM-DD
  unread: number;
  intake: ClientIntake;
};

const field =
  'w-full rounded-xl border border-line bg-shell px-3.5 py-2.5 text-sm text-ink outline-none transition-colors duration-300 focus:border-coral';
const label = 'font-mono text-[8.5px] tracking-[0.18em] text-mute';

export function money(cents: number): string {
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: cents % 100 === 0 ? 0 : 2, maximumFractionDigits: 2 })}`;
}

function fmtDay(day: string | null, fallback = '—'): string {
  if (!day) return fallback;
  return new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric' })
    .format(new Date(`${day}T12:00:00Z`))
    .toUpperCase();
}

/** "RENEWS THE 25TH" — anchored to the day of the month they joined. */
function renewalLine(startedAt: string | null): string | null {
  if (!startedAt) return null;
  const d = Number(startedAt.slice(8, 10));
  const suffix = d % 10 === 1 && d !== 11 ? 'ST' : d % 10 === 2 && d !== 12 ? 'ND' : d % 10 === 3 && d !== 13 ? 'RD' : 'TH';
  return `RENEWS THE ${d}${suffix}`;
}

function generatePassword(): string {
  const words = ['sunrise', 'progress', 'gulf', 'golden', 'palm', 'sandbar', 'sweat', 'thirty-a'];
  const w = words[Math.floor(Math.random() * words.length)];
  const n = Math.floor(100 + Math.random() * 900);
  return `${w}-${n}-club`;
}

export function ClientModal({ client, onClose }: { client: ClientProfile | null; onClose: () => void }) {
  const reduced = useReducedMotion();

  // lock the page behind the sheet
  useEffect(() => {
    if (!client) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [client]);

  return (
    <AnimatePresence>
      {client && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto p-4 sm:p-8"
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduced ? undefined : { opacity: 0 }}
          transition={{ duration: 0.28, ease: EASE }}
        >
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="fixed inset-0 cursor-default bg-ink/35 backdrop-blur-[3px]"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={`${client.name} profile`}
            initial={reduced ? false : { opacity: 0, y: 22, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? undefined : { opacity: 0, y: 12, scale: 0.99 }}
            transition={{ duration: 0.42, ease: EASE }}
            className="relative my-auto w-full max-w-2xl overflow-hidden rounded-3xl border border-line bg-card shadow-[0_30px_80px_-24px_rgba(35,48,41,0.4)]"
          >
            {/* key forces a clean form state whenever a different client is opened */}
            <ProfileBody key={client.id} client={client} onClose={onClose} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ProfileBody({ client, onClose }: { client: ClientProfile; onClose: () => void }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [name, setName] = useState(client.name);
  const [email, setEmail] = useState(client.email);
  const [phone, setPhone] = useState(client.phone);
  const [price, setPrice] = useState((client.priceCents / 100).toString());
  const [notes, setNotes] = useState(client.notes);
  const [active, setActive] = useState(client.active);
  const [startedAt, setStartedAt] = useState(client.startedAt ?? '');

  const [pwOpen, setPwOpen] = useState(false);
  const [newPw, setNewPw] = useState('');
  const [pwDone, setPwDone] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [tab, setTab] = useState<'account' | 'about'>('account');
  const [coachContext, setCoachContext] = useState(client.intake.coachContext);
  const [injuries, setInjuries] = useState(client.intake.injuries);
  const [goal, setGoal] = useState(client.intake.goal);
  const [equipment, setEquipment] = useState(client.intake.equipment);
  const [anythingElse, setAnythingElse] = useState(client.intake.anythingElse);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const save = () =>
    start(async () => {
      setError(null);
      // both panels save together — she shouldn't have to think about which tab she's on
      const [a, b] = await Promise.all([
        updateClient({ id: client.id, fullName: name, email, phone, price, notes, active, startedAt }),
        updateClientCoaching({ userId: client.id, coachContext, injuries, goal, equipment, anythingElse }),
      ]);
      const err = a.error ?? b.error;
      if (err) {
        setError(err);
        return;
      }
      setSaved(true);
      router.refresh();
      setTimeout(onClose, 550);
    });

  const remove = () =>
    start(async () => {
      const res = await deleteClient(client.id);
      if (res.error) {
        setError(res.error);
        return;
      }
      router.refresh();
      onClose();
    });

  const renews = renewalLine(startedAt || client.startedAt);

  return (
    <div className="flex max-h-[86vh] flex-col">
      {/* everything above the action bar scrolls; the bar itself never covers it */}
      <div className="min-h-0 flex-1 overflow-y-auto p-6 sm:p-8">
      {/* header */}
      <div className="flex items-start gap-4">
        <span className="mt-0.5 h-12 w-12 shrink-0 rounded-full bg-gradient-to-br from-sandbar to-sea" />
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[8.5px] tracking-[0.2em] text-coral">CLIENT PROFILE</p>
          <h2 className="mt-1 truncate font-display text-2xl font-normal">{client.name}</h2>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full border px-2.5 py-0.5 font-mono text-[8px] tracking-[0.14em] ${
                active ? 'border-sea/40 text-sea' : 'border-line text-mute'
              }`}
            >
              {active ? 'ACTIVE' : 'PAUSED'}
            </span>
            <span className="tab-nums font-mono text-[8px] tracking-[0.14em] text-[#9C7220]">
              {money(client.priceCents)}/MO
            </span>
            {renews && <span className="font-mono text-[8px] tracking-[0.14em] text-mute">{renews}</span>}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close profile"
          className="shrink-0 rounded-full border border-line px-3 py-1.5 font-mono text-[9px] tracking-[0.14em] text-ink2 transition-colors hover:border-coral hover:text-coral"
        >
          CLOSE ✕
        </button>
      </div>

      {/* tabs */}
      <div className="mt-6 flex gap-1.5 rounded-full border border-line bg-shell p-1">
        {(
          [
            ['account', 'ACCOUNT & BILLING'],
            ['about', client.intake.injuries ? 'ABOUT THEM ⚑' : 'ABOUT THEM'],
          ] as const
        ).map(([k, l]) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            aria-pressed={tab === k}
            className={`flex-1 rounded-full px-4 py-2 font-mono text-[8.5px] tracking-[0.14em] transition-colors duration-300 ${
              tab === k ? 'bg-card text-ink shadow-[0_1px_3px_rgba(35,48,41,0.1)]' : 'text-mute hover:text-ink2'
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      {tab === 'about' ? (
        <AboutPanel
          intake={client.intake}
          coachContext={coachContext}
          setCoachContext={setCoachContext}
          injuries={injuries}
          setInjuries={setInjuries}
          goal={goal}
          setGoal={setGoal}
          equipment={equipment}
          setEquipment={setEquipment}
          anythingElse={anythingElse}
          setAnythingElse={setAnythingElse}
        />
      ) : (
        <>
      {/* stats */}
      <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {[
          { k: 'CURRENT STREAK', v: `${client.streak}`, s: 'DAYS' },
          { k: 'BEST STREAK', v: `${client.best}`, s: 'DAYS' },
          { k: 'CHECK-INS', v: `${client.total}`, s: 'TOTAL' },
          { k: 'LAST ACTIVE', v: client.last ? fmtDay(client.last).split(',')[0] : '—', s: client.last ? '' : 'NEVER' },
        ].map((s) => (
          <div key={s.k} className="rounded-xl border border-line bg-shell px-3.5 py-3">
            <p className="font-mono text-[7.5px] tracking-[0.16em] text-mute">{s.k}</p>
            <p className="tab-nums mt-1 font-mono text-[17px] leading-tight">{s.v}</p>
            {s.s && <p className="font-mono text-[7.5px] tracking-[0.14em] text-mute">{s.s}</p>}
          </div>
        ))}
      </div>

      {/* editable fields */}
      <div className="mt-6 grid gap-3.5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="cp-name" className={label}>
            FULL NAME
          </label>
          <input id="cp-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} className={`${field} mt-1.5`} />
        </div>
        <div>
          <label htmlFor="cp-email" className={label}>
            EMAIL — THIS IS THEIR LOGIN
          </label>
          <input id="cp-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={`${field} mt-1.5`} />
        </div>
        <div>
          <label htmlFor="cp-phone" className={label}>
            PHONE
          </label>
          <input
            id="cp-phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(850) 555-0134"
            maxLength={40}
            className={`${field} mt-1.5`}
          />
        </div>
        <div>
          <label htmlFor="cp-price" className={label}>
            MONTHLY PRICE
          </label>
          <div className="relative mt-1.5">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-[13px] text-mute">$</span>
            <input
              id="cp-price"
              inputMode="decimal"
              value={price}
              onChange={(e) => setPrice(e.target.value.replace(/[^0-9.]/g, ''))}
              className={`${field} tab-nums pl-7 font-mono`}
            />
          </div>
        </div>
        <div>
          <label htmlFor="cp-started" className={label}>
            MEMBER SINCE
          </label>
          <input
            id="cp-started"
            type="date"
            value={startedAt}
            onChange={(e) => setStartedAt(e.target.value)}
            className={`${field} mt-1.5 font-mono text-[12px]`}
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="cp-notes" className={label}>
            PRIVATE NOTES — SHE&apos;S THE ONLY ONE WHO SEES THIS
          </label>
          <textarea
            id="cp-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder="Bad knee on the left. Travels for work every other week. Paid through Venmo on the 3rd."
            className={`${field} mt-1.5 resize-y leading-relaxed`}
          />
        </div>
      </div>

      {/* status + messages */}
      <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-line bg-shell px-4 py-3">
        <button
          type="button"
          role="switch"
          aria-checked={active}
          onClick={() => setActive((v) => !v)}
          className={`relative h-6 w-11 shrink-0 rounded-full border transition-colors duration-300 ${
            active ? 'border-sea/50 bg-sea/25' : 'border-line bg-sandbar'
          }`}
        >
          <span
            className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full transition-all duration-300 ${
              active ? 'left-[24px] bg-sea' : 'left-1 bg-mute'
            }`}
          />
        </button>
        <span className="font-mono text-[9px] tracking-[0.14em] text-ink2">
          {active ? 'ACTIVE — THEY CAN LOG IN' : 'PAUSED — LOGIN BLOCKED, DATA KEPT'}
        </span>
        <Link
          href={`/hq/messages?u=${client.id}`}
          className="ml-auto font-mono text-[9px] tracking-[0.14em] text-sea underline decoration-line underline-offset-4 hover:text-coral"
        >
          {client.unread > 0 ? `${client.unread} UNREAD →` : 'MESSAGE THEM →'}
        </Link>
      </div>

      {/* password */}
      <div className="mt-3 rounded-xl border border-line bg-shell px-4 py-3">
        <button
          type="button"
          onClick={() => setPwOpen((v) => !v)}
          className="font-mono text-[9px] tracking-[0.14em] text-ink2 hover:text-coral"
        >
          {pwOpen ? '− RESET PASSWORD' : '+ RESET PASSWORD'}
        </button>
        {pwOpen && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <input
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              placeholder="New password (8+ chars)"
              className={`${field} min-w-0 flex-1 bg-card`}
            />
            <button
              type="button"
              onClick={() => setNewPw(generatePassword())}
              className="shrink-0 rounded-xl border border-line px-3.5 py-2.5 font-mono text-[9px] tracking-[0.12em] text-ink2 transition-colors hover:border-coral hover:text-coral"
            >
              GENERATE
            </button>
            <button
              type="button"
              disabled={pending || newPw.length < 8}
              onClick={() =>
                start(async () => {
                  const res = await resetClientPassword(client.id, newPw);
                  if (res.error) setError(res.error);
                  else {
                    setPwDone(newPw);
                    setNewPw('');
                    setPwOpen(false);
                  }
                })
              }
              className="shrink-0 rounded-full bg-ink px-4 py-2.5 font-mono text-[9px] tracking-[0.14em] text-shell transition-colors hover:bg-coral disabled:opacity-40"
            >
              SET
            </button>
          </div>
        )}
        {pwDone && (
          <p className="mt-2 break-words font-mono text-[9px] tracking-[0.1em] text-[#9C7220]">
            NEW PASSWORD SET → SEND THEM: {pwDone}
          </p>
        )}
      </div>
        </>
      )}

      {error && <p className="mt-3 text-[13px] text-corald">{error}</p>}
      </div>

      {/* action bar — outside the scroller, so it can never sit on top of a field */}
      <div className="flex shrink-0 flex-wrap items-center gap-3 rounded-b-3xl border-t border-line2 bg-card px-6 py-4 sm:px-8">
        {confirmDelete ? (
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="font-mono text-[9px] tracking-[0.12em] text-corald">DELETE {client.name.toUpperCase()} FOREVER?</span>
            <button
              type="button"
              disabled={pending}
              onClick={remove}
              className="rounded-full bg-corald px-4 py-2 font-mono text-[9px] tracking-[0.14em] text-card disabled:opacity-50"
            >
              YES, REMOVE
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="font-mono text-[9px] tracking-[0.14em] text-mute hover:text-ink"
            >
              KEEP THEM
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="font-mono text-[9px] tracking-[0.14em] text-mute transition-colors hover:text-corald"
          >
            REMOVE CLIENT
          </button>
        )}

        <div className="ml-auto flex items-center gap-3">
          <button type="button" onClick={onClose} className="font-mono text-[9px] tracking-[0.14em] text-mute hover:text-ink">
            CANCEL
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={save}
            className="rounded-full bg-coral px-5 py-2.5 font-mono text-[9.5px] tracking-[0.16em] text-card transition-colors duration-300 hover:bg-corald disabled:opacity-60"
          >
            {saved ? 'SAVED ✓' : pending ? 'SAVING…' : 'SAVE CHANGES'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* ABOUT THEM — their intake answers + the note the AI actually reads   */
/* ------------------------------------------------------------------ */

function Fact({ k, v }: { k: string; v: string | number | null }) {
  return (
    <div className="rounded-xl border border-line bg-shell px-3.5 py-3">
      <p className="font-mono text-[7.5px] tracking-[0.16em] text-mute">{k}</p>
      <p className="mt-1 truncate text-[14px] font-bold text-ink">{v === null || v === '' ? '—' : v}</p>
    </div>
  );
}

function AboutPanel({
  intake,
  coachContext,
  setCoachContext,
  injuries,
  setInjuries,
  goal,
  setGoal,
  equipment,
  setEquipment,
  anythingElse,
  setAnythingElse,
}: {
  intake: ClientIntake;
  coachContext: string;
  setCoachContext: (v: string) => void;
  injuries: string;
  setInjuries: (v: string) => void;
  goal: string;
  setGoal: (v: string) => void;
  equipment: string;
  setEquipment: (v: string) => void;
  anythingElse: string;
  setAnythingElse: (v: string) => void;
}) {
  return (
    <div className="mt-5">
      {!intake.completed && (
        <div className="rounded-xl border border-dashed border-line bg-shell px-4 py-3">
          <p className="font-mono text-[9px] tracking-[0.14em] text-mute">
            THEY HAVEN&apos;T FINISHED THE WELCOME QUESTIONS YET
          </p>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink2">
            The form shows up automatically the first time they log in. You can still write a coach note below — the AI will use
            it either way.
          </p>
        </div>
      )}

      {/* the note that steers the AI */}
      <div className="mt-4 rounded-2xl border border-sea/40 bg-sea/[0.06] p-4">
        <label htmlFor="cp-coach" className="font-mono text-[8.5px] tracking-[0.18em] text-sea">
          WHAT THE AI COACH SHOULD KNOW
        </label>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink2">
          Your coaching note, in your voice. The in-workout coach reads this every time they open the chat.
        </p>
        <textarea
          id="cp-coach"
          value={coachContext}
          onChange={(e) => setCoachContext(e.target.value)}
          rows={4}
          maxLength={2000}
          placeholder="Push her on upper body, she under-loads. Never program box jumps — sub step-ups. She responds to short cues, not paragraphs. Coming back from a long break, so praise consistency over PRs."
          className={`${field} mt-3 resize-y bg-card leading-relaxed`}
        />
        <p className="mt-2 font-mono text-[8px] leading-relaxed tracking-[0.1em] text-sea/80">
          ↑ SENT TO THE AI · YOUR PRIVATE NOTES ON THE ACCOUNT TAB ARE NOT
        </p>
      </div>

      {/* their own answers */}
      <p className="mt-6 font-mono text-[8.5px] tracking-[0.18em] text-coral">THEIR ANSWERS</p>
      <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        <Fact k="AGE" v={intake.age} />
        <Fact k="HEIGHT" v={intake.height} />
        <Fact k="WEIGHT" v={intake.weightLb ? `${intake.weightLb} lb` : null} />
        <Fact k="EXPERIENCE" v={intake.experience} />
        <Fact k="DAYS / WEEK" v={intake.daysPerWeek} />
      </div>

      <div className="mt-4 space-y-3.5">
        <div>
          <label htmlFor="cp-injuries" className={`${label} text-corald`}>
            INJURIES &amp; LIMITATIONS — THE AI SCALES AROUND THIS
          </label>
          <textarea
            id="cp-injuries"
            value={injuries}
            onChange={(e) => setInjuries(e.target.value)}
            rows={3}
            maxLength={1500}
            placeholder="Nothing listed yet."
            className={`${field} mt-1.5 resize-y leading-relaxed`}
          />
        </div>
        <div>
          <label htmlFor="cp-goal" className={label}>
            WHAT THEY&apos;RE CHASING
          </label>
          <textarea
            id="cp-goal"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            rows={2}
            maxLength={600}
            placeholder="Nothing listed yet."
            className={`${field} mt-1.5 resize-y leading-relaxed`}
          />
        </div>
        <div>
          <label htmlFor="cp-equip" className={label}>
            EQUIPMENT THEY HAVE
          </label>
          <input
            id="cp-equip"
            value={equipment}
            onChange={(e) => setEquipment(e.target.value)}
            maxLength={600}
            placeholder="Nothing listed yet."
            className={`${field} mt-1.5`}
          />
        </div>
        <div>
          <label htmlFor="cp-else" className={label}>
            ANYTHING ELSE THEY SHARED
          </label>
          <textarea
            id="cp-else"
            value={anythingElse}
            onChange={(e) => setAnythingElse(e.target.value)}
            rows={2}
            maxLength={1500}
            placeholder="Nothing listed yet."
            className={`${field} mt-1.5 resize-y leading-relaxed`}
          />
        </div>
      </div>

      <p className="mt-4 font-mono text-[8px] tracking-[0.12em] text-mute">
        {intake.agreedAt
          ? `MEMBER AGREEMENT ACCEPTED ${intake.agreedAt}${intake.agreedVersion ? ` · v${intake.agreedVersion}` : ''}`
          : 'MEMBER AGREEMENT NOT YET ACCEPTED'}
      </p>
    </div>
  );
}
