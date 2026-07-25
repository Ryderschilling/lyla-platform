'use client';

import { useRef, useState } from 'react';
import { PlayGlyph, SunMark } from '../ui/marks';
import type { ReelSlot } from '@/lib/photos';

/**
 * 9:16 reel tile — poster in grayscale, melts to color on hover/play.
 * peek: hover-to-play (muted). player: tap to play with sound toggle.
 */
export function ReelTile({ reel, mode = 'player', label }: { reel: ReelSlot; mode?: 'peek' | 'player'; label?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);

  const play = () => {
    const v = videoRef.current;
    if (!v) return;
    v.play().catch(() => {});
    setPlaying(true);
  };
  const stop = () => {
    const v = videoRef.current;
    if (!v) return;
    v.pause();
    setPlaying(false);
  };

  if (!reel.src) {
    return (
      <div
        className="group relative overflow-hidden rounded-2xl border border-dashed border-line bg-sandbar"
        style={{ aspectRatio: '9/16' }}
        role="img"
        aria-label={`Reel slot ${reel.slot}`}
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-3 text-center">
          <SunMark className="h-6 w-6 text-mute" />
          <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-mute break-words max-w-full">
            photos/{reel.slot}.mp4
          </span>
        </div>
        {label && (
          <span className="absolute inset-x-3 bottom-3 font-mono text-[9px] tracking-[0.14em] text-ink2">{label}</span>
        )}
      </div>
    );
  }

  const grayscale = !playing;

  return (
    <button
      type="button"
      className="group relative block w-full overflow-hidden rounded-2xl border border-line bg-ink text-left"
      style={{ aspectRatio: '9/16' }}
      onPointerEnter={mode === 'peek' ? play : undefined}
      onPointerLeave={mode === 'peek' ? stop : undefined}
      onClick={() => {
        if (mode === 'peek') return;
        if (!playing) {
          setMuted(false);
          if (videoRef.current) videoRef.current.muted = false;
          play();
        } else {
          stop();
        }
      }}
      aria-label={playing ? 'Pause reel' : 'Play reel'}
    >
      <video
        ref={videoRef}
        src={reel.src}
        poster={reel.poster ?? undefined}
        muted={muted}
        loop
        playsInline
        preload="none"
        className="absolute inset-0 h-full w-full object-cover transition-[filter,transform] duration-700 ease-brand"
        style={{
          filter: grayscale ? 'grayscale(1) contrast(1.08)' : 'grayscale(0)',
          transform: grayscale ? 'scale(1.04)' : 'scale(1)',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent opacity-80" />
      {!playing && (
        <span className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-card/90 text-ink">
          <PlayGlyph className="h-3 w-3 translate-x-[1px]" />
        </span>
      )}
      {mode === 'player' && playing && (
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            const next = !muted;
            setMuted(next);
            if (videoRef.current) videoRef.current.muted = next;
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.stopPropagation();
              const next = !muted;
              setMuted(next);
              if (videoRef.current) videoRef.current.muted = next;
            }
          }}
          className="absolute right-3 top-3 flex h-8 items-center justify-center rounded-full bg-card/90 px-3 font-mono text-[9px] tracking-[0.14em] text-ink"
        >
          {muted ? 'SOUND ON' : 'MUTE'}
        </span>
      )}
      {label && (
        <span className="absolute inset-x-3 bottom-3 font-mono text-[9px] tracking-[0.14em] text-shell">{label}</span>
      )}
    </button>
  );
}
