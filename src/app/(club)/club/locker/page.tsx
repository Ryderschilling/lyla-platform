import type { Metadata } from 'next';
import { requireUser } from '@/lib/auth';
import { db, schema } from '@/lib/db';
import { asc } from 'drizzle-orm';
import { CopyChip } from '@/components/ui/CopyChip';
import { ArrowNE } from '@/components/ui/motion';
import { SunMark } from '@/components/ui/marks';

export const metadata: Metadata = { title: 'The Locker' };
export const dynamic = 'force-dynamic';

export default async function ClubLockerPage() {
  await requireUser();
  const codes = await db.query.referralCodes.findMany({
    orderBy: [asc(schema.referralCodes.sort), asc(schema.referralCodes.createdAt)],
  });

  return (
    <div className="mx-auto max-w-2xl p-5 md:p-7">
      <p className="eyebrow text-night-sub">Member perks</p>
      <h1 className="mt-2 font-display text-3xl font-normal text-night-text">The Locker</h1>
      <p className="mt-2 max-w-md text-[13px] leading-relaxed text-night-sub">
        Everything here is in Lyla&apos;s actual rotation. Codes save you money and keep the Club lights on.
      </p>

      {codes.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-4 rounded-2xl border border-dashed border-night-line px-6 py-16 text-center">
          <SunMark className="h-7 w-7 text-night-sub" />
          <p className="text-sm text-night-sub">Lyla&apos;s stocking the Locker — codes drop here soon.</p>
        </div>
      ) : (
        <div className="mt-7 flex flex-col gap-2.5">
          {codes.map((c, i) => (
            <div key={c.id} className="rounded-[13px] border border-night-line bg-night-card p-5">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-mono text-[9px] tracking-[0.16em] text-coral">{String(i + 1).padStart(2, '0')}</span>
                <h2 className="font-display text-xl font-normal text-night-text">{c.brand}</h2>
                {c.url && (
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto font-mono text-[9.5px] tracking-[0.14em] text-night-sub transition-colors duration-300 hover:text-coral"
                  >
                    SHOP <ArrowNE />
                  </a>
                )}
              </div>
              {c.blurb && <p className="mt-2 text-[13px] leading-relaxed text-night-sub">{c.blurb}</p>}
              <div className="mt-3.5">
                <CopyChip text={c.code} dark />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
