import { SunMark } from './marks';

type Frame = 'arch' | 'rounded' | 'archfull';

/**
 * Photography-led UI: renders Lyla's real photo with a warm film grade,
 * or a styled placeholder (sandbar block, mono slot name, correct aspect)
 * until her batch drops into /public/photos.
 */
export function PhotoSlot({
  src,
  slot,
  aspect = '4/5',
  frame = 'rounded',
  duotone = false,
  alt = '',
  className = '',
  imgClassName = '',
  children,
}: {
  src: string | null;
  slot: string;
  aspect?: string;
  frame?: Frame;
  duotone?: boolean;
  alt?: string;
  className?: string;
  imgClassName?: string;
  children?: React.ReactNode;
}) {
  const radius =
    frame === 'arch' ? 'rounded-arch' : frame === 'archfull' ? 'rounded-archfull' : 'rounded-2xl';

  if (!src) {
    return (
      <div
        className={`relative overflow-hidden border border-dashed border-line bg-sandbar ${radius} ${className}`}
        style={{ aspectRatio: aspect }}
        role="img"
        aria-label={`Photo slot ${slot}`}
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 text-center">
          <SunMark className="h-6 w-6 text-mute" />
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-mute break-words max-w-full">
            photos/{slot}.jpg
          </span>
        </div>
        {children}
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${radius} ${className}`} style={{ aspectRatio: aspect }}>
      {/* warm film grade */}
      <img
        src={src}
        alt={alt}
        className={`absolute inset-0 h-full w-full object-cover ${imgClassName}`}
        style={{ filter: 'sepia(0.12) saturate(1.05) contrast(1.02) brightness(1.01)' }}
      />
      {duotone && (
        <>
          {/* palm-ink / coral duotone wash for text-on-image moments */}
          <div className="absolute inset-0" style={{ background: 'rgba(35,48,41,0.38)', mixBlendMode: 'multiply' }} />
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(160deg, rgba(222,122,82,0.34), rgba(223,166,62,0.10) 55%, rgba(35,48,41,0.25))',
              mixBlendMode: 'soft-light',
            }}
          />
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(180deg, transparent 42%, rgba(35,48,41,0.55))' }}
          />
        </>
      )}
      {/* grain inside the frame */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07] mix-blend-multiply"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
      {children}
    </div>
  );
}
