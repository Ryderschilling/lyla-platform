import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth';
import { db, schema } from '@/lib/db';
import { asc } from 'drizzle-orm';
import { LockerManager } from '@/components/hq/LockerManager';

export const metadata: Metadata = { title: 'The Locker' };
export const dynamic = 'force-dynamic';

export default async function HqLockerPage() {
  await requireAdmin();
  const codes = await db.query.referralCodes.findMany({
    orderBy: [asc(schema.referralCodes.sort), asc(schema.referralCodes.createdAt)],
  });

  return (
    <div className="mx-auto max-w-3xl">
      <p className="eyebrow text-coral">Codes go live on the site instantly</p>
      <h1 className="mt-2 font-display text-3xl font-normal">The Locker</h1>
      <p className="mt-2 max-w-lg text-[13px] leading-relaxed text-ink2">
        Whatever you add here shows on the public Locker page and inside the Club. Position 1 sits at the top — set anything to 1
        and the rest slide down on their own.
      </p>
      <div className="mt-6">
        <LockerManager
          codes={codes.map((c) => ({ id: c.id, brand: c.brand, code: c.code, url: c.url ?? '', blurb: c.blurb ?? '', sort: c.sort }))}
        />
      </div>
    </div>
  );
}
