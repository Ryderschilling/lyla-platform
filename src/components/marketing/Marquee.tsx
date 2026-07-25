const ITEMS = ['DAILY WODS', 'REAL COACHING', 'FAITH + SWEAT', 'BUILT ON 30A', 'PROGRESS OVER PERFECTION'];

export function Marquee() {
  const run = (
    <div className="flex shrink-0 items-center">
      {ITEMS.map((item) => (
        <span key={item} className="flex items-center whitespace-nowrap pr-10 font-mono text-[10px] tracking-[0.26em] text-ink2">
          {item}
          <span className="pl-10 text-coral" aria-hidden>
            ✦
          </span>
        </span>
      ))}
    </div>
  );
  return (
    <div className="overflow-hidden border-y border-line2 bg-[rgba(255,252,244,0.6)] py-3.5" aria-hidden>
      <div className="flex w-max animate-marquee motion-reduce:animate-none">
        {run}
        {run}
      </div>
    </div>
  );
}
