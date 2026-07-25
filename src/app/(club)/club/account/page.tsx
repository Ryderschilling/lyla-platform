import type { Metadata } from 'next';
import { eq } from 'drizzle-orm';
import { requireUser } from '@/lib/auth';
import { db, schema } from '@/lib/db';
import { logout } from '@/lib/actions/auth-actions';
import { ChangePasswordForm } from '@/components/club/ChangePasswordForm';
import { ProfileEditor, EMPTY_DRAFT, type IntakeDraft } from '@/components/club/IntakeForm';
import { AI_DISCLAIMER_LONG } from '@/lib/legal';

export const metadata: Metadata = { title: 'Account' };
export const dynamic = 'force-dynamic';

const str = (v: number | string | null | undefined) => (v === null || v === undefined ? '' : String(v));

export default async function AccountPage() {
  const session = await requireUser();
  const profile = await db.query.clientProfiles.findFirst({
    where: eq(schema.clientProfiles.userId, session.id),
  });

  const draft: IntakeDraft = profile
    ? {
        ...EMPTY_DRAFT,
        age: str(profile.age),
        heightFt: profile.heightIn != null ? String(Math.floor(profile.heightIn / 12)) : '',
        heightInches: profile.heightIn != null ? String(profile.heightIn % 12) : '',
        weightLb: str(profile.weightLb),
        experience: str(profile.experience),
        daysPerWeek: str(profile.daysPerWeek),
        goal: str(profile.goal),
        injuries: str(profile.injuries),
        equipment: str(profile.equipment),
        anythingElse: str(profile.anythingElse),
      }
    : EMPTY_DRAFT;

  return (
    <div className="mx-auto max-w-2xl p-5 md:p-7">
      <p className="eyebrow text-night-sub">You, on file</p>
      <h1 className="mt-2 font-display text-3xl font-normal text-night-text">Account</h1>

      <div className="mt-7 rounded-2xl border border-night-line bg-night-card p-6">
        <p className="font-mono text-[8.5px] tracking-[0.2em] text-night-sub">SIGNED IN AS</p>
        <p className="mt-2 text-lg font-bold text-night-text">{session.name}</p>
        <p className="mt-1 break-words font-mono text-[clamp(11px,3vw,13px)] tracking-[0.04em] text-night-sub">{session.email}</p>
        <p className="mt-4 border-t border-night-line pt-4 text-[12.5px] leading-relaxed text-night-sub">
          Membership questions, pauses, or cancellations — just message Lyla. No forms, no hoops.
        </p>
      </div>

      <div className="mt-5 rounded-2xl border border-night-line bg-night-card p-6">
        <p className="font-mono text-[8.5px] tracking-[0.2em] text-coral">ABOUT YOU</p>
        <p className="mt-2 text-[13px] leading-relaxed text-night-sub">
          Change these any time — a new injury, new equipment, a new goal. Lyla sees this, and your in-workout coach uses it to
          scale movements to you.
        </p>
        <div className="mt-6">
          <ProfileEditor initial={draft} />
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-night-line bg-night-card p-6">
        <p className="font-mono text-[8.5px] tracking-[0.2em] text-night-sub">CHANGE PASSWORD</p>
        <div className="mt-4">
          <ChangePasswordForm />
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-night-line bg-night-card/60 p-5">
        <p className="font-mono text-[8.5px] tracking-[0.2em] text-night-sub">THE FINE PRINT</p>
        <p className="mt-2 text-[12px] leading-relaxed text-night-sub">{AI_DISCLAIMER_LONG}</p>
        {profile?.agreedAt && (
          <p className="mt-3 font-mono text-[8px] tracking-[0.12em] text-night-sub/60">
            MEMBER AGREEMENT ACCEPTED{' '}
            {new Intl.DateTimeFormat('en-US', { timeZone: 'America/Chicago', month: 'short', day: 'numeric', year: 'numeric' })
              .format(profile.agreedAt)
              .toUpperCase()}
            {profile.agreedVersion ? ` · v${profile.agreedVersion}` : ''}
          </p>
        )}
      </div>

      <form action={logout} className="mt-8 text-center">
        <button
          type="submit"
          className="rounded-full border border-night-line px-6 py-3 font-mono text-[10px] tracking-[0.16em] text-night-sub transition-colors duration-300 hover:border-coral hover:text-coral"
        >
          SIGN OUT
        </button>
      </form>
    </div>
  );
}
