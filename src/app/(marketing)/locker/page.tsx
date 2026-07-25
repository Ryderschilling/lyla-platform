import type { Metadata } from 'next';
import { db, schema } from '@/lib/db';
import { asc } from 'drizzle-orm';
import { getPhotoManifest } from '@/lib/photos';
import { PhotoSlot } from '@/components/ui/PhotoSlot';
import { Reveal, ArrowNE } from '@/components/ui/motion';
import { CopyChip } from '@/components/ui/CopyChip';
import { SunMark } from '@/components/ui/marks';

export const metadata: Metadata = { title: 'The Locker' };
export const dynamic = 'force-dynamic';

const ACCENTS = ['text-coral', 'text-sea', 'text-[#9C7220]'];

export default async function LockerPage() {
  const codes = await db.query.referralCodes.findMany({
    orderBy: [asc(schema.referralCodes.sort), asc(schema.referralCodes.createdAt)],
  });
  const photos = getPhotoManifest();
  const lockerSlots = ['locker-01', 'locker-02', 'locker-03', 'locker-04', 'locker-05', 'locker-06'];

  return (
    <div className="mx-auto max-w-6xl px-5 pb-24 pt-28 md:px-10 md:pt-36">
      <Reveal>
        <p className="eyebrow text-sea">The Locker · codes that actually get used</p>
        <h1 className="mt-3 max-w-[16ch] font-display text-[clamp(38px,6vw,68px)] font-normal leading-[1.0] tracking-tight">
          The stuff I <em className="italic text-coral">actually use.</em>
        </h1>
        <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-ink2">
          Every brand in the Locker is in my kitchen, my gym bag, or on my body in the reels. The codes save you money and
          keep the Club lights on — win, win.
        </p>
      </Reveal>

      {codes.length === 0 ? (
        <Reveal className="mt-14">
          <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-line bg-card px-6 py-20 text-center">
            <SunMark className="h-8 w-8 text-mute" />
            <p className="font-display text-xl">The Locker is getting stocked.</p>
            <p className="max-w-sm text-sm text-ink2">Lyla&apos;s codes land here soon — check back after your next workout.</p>
          </div>
        </Reveal>
      ) : (
        <div className="mt-12 grid gap-4 md:grid-cols-2 md:gap-5">
          {codes.map((c, i) => (
            <Reveal key={c.id} delay={(i % 2) * 0.08}>
              <div className="group grid h-full grid-cols-[1fr_auto] gap-6 rounded-2xl border border-line bg-card p-7 transition-all duration-500 ease-brand hover:-translate-y-1 hover:shadow-[0_24px_60px_-30px_rgba(35,48,41,0.25)]">
                <div className="flex flex-col">
                  <span className={`font-mono text-[10px] tracking-[0.2em] ${ACCENTS[i % ACCENTS.length]}`}>
                    {String(i + 1).padStart(2, '0')} · IN THE LOCKER
                  </span>
                  <h2 className="mt-3 font-display text-[clamp(22px,2.6vw,28px)] font-normal leading-tight">{c.brand}</h2>
                  {c.blurb && <p className="mt-2 text-sm leading-relaxed text-ink2">{c.blurb}</p>}
                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <CopyChip text={c.code} />
                    {c.url && (
                      <a
                        href={c.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-[10px] tracking-[0.14em] text-ink2 transition-colors duration-300 hover:text-coral"
                      >
                        SHOP <ArrowNE />
                      </a>
                    )}
                  </div>
                </div>
                <PhotoSlot
                  src={photos[lockerSlots[i % lockerSlots.length]]}
                  slot={lockerSlots[i % lockerSlots.length]}
                  aspect="3/4"
                  frame="arch"
                  className="w-24 self-center sm:w-28"
                  alt={`${c.brand} in use`}
                />
              </div>
            </Reveal>
          ))}
        </div>
      )}

      <Reveal className="mt-14">
        <p className="text-center font-mono text-[9px] uppercase tracking-[0.22em] text-mute">
          Codes are affiliate links — they cost you nothing extra and support the Club
        </p>
      </Reveal>
    </div>
  );
}
