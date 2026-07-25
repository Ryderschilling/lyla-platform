import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { requireUser } from '@/lib/auth';
import { db, schema } from '@/lib/db';
import { AGREEMENT_VERSION } from '@/lib/legal';
import { IntakeWizard, EMPTY_DRAFT, type IntakeDraft } from '@/components/club/IntakeForm';

export const dynamic = 'force-dynamic';

const str = (v: number | string | null | undefined) => (v === null || v === undefined ? '' : String(v));

export default async function WelcomePage() {
  const session = await requireUser();
  if (session.role === 'admin') redirect('/hq');

  const profile = await db.query.clientProfiles.findFirst({
    where: eq(schema.clientProfiles.userId, session.id),
  });
  // already done AND on the current agreement — nothing to ask
  if (profile?.completedAt && profile.agreedVersion === AGREEMENT_VERSION) redirect('/club');

  // If they're only here because the agreement version moved, prefill everything
  // they already told us. Nobody retypes their injuries to re-accept terms.
  const initial: IntakeDraft | undefined = profile
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
    : undefined;

  const firstName = (session.name || '').trim().split(/\s+/)[0] || 'friend';
  return <IntakeWizard firstName={firstName} initial={initial} />;
}
