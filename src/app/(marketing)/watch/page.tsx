import type { Metadata } from 'next';
import { getReels } from '@/lib/photos';
import { Reveal } from '@/components/ui/motion';
import { ReelTile } from '@/components/marketing/ReelTile';

export const metadata: Metadata = { title: 'Watch' };
export const dynamic = 'force-dynamic';

export default function WatchPage() {
  const reels = getReels(20);
  const loaded = reels.filter((r) => r.src).length;

  return (
    <div className="mx-auto max-w-6xl px-5 pb-24 pt-28 md:px-10 md:pt-36">
      <Reveal>
        <p className="eyebrow text-coral">Watch · her top 20</p>
        <h1 className="mt-3 max-w-[16ch] font-display text-[clamp(38px,6vw,68px)] font-normal leading-[1.0] tracking-tight">
          Real training, <em className="italic text-coral">no filter.</em>
        </h1>
        <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-ink2">
          Twenty reels straight from Lyla&apos;s feed — workouts, protein cookies, and the occasional sermon from the garage
          gym. Tap any tile to play with sound.
        </p>
        {loaded === 0 && (
          <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-mute">
            Reel files land here the moment Lyla&apos;s batch drops into /photos — slots are ready below.
          </p>
        )}
      </Reveal>

      <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-5 lg:grid-cols-4">
        {reels.map((reel, i) => (
          <Reveal key={reel.slot} delay={(i % 4) * 0.07}>
            <ReelTile reel={reel} mode="player" />
          </Reveal>
        ))}
      </div>
    </div>
  );
}
