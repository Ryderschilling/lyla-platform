'use client';

import { PlayGlyph } from '../ui/marks';

/** Dark training-room primitives shared by the live WOD page and the public demo. */

export function GroupLabel({ children }: { children: React.ReactNode }) {
  return <p className="mb-1 mt-2.5 font-mono text-[10px] tracking-[0.2em] text-gold">{children}</p>;
}

export function MovementRow({
  idx,
  name,
  detail,
  mediaUrl,
  mediaType,
  onPlay,
}: {
  idx: string;
  name: string;
  detail?: string | null;
  mediaUrl?: string | null;
  mediaType?: string | null;
  onPlay?: () => void;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-night-line bg-night-card px-5 py-4">
      <span className="w-7 shrink-0 font-mono text-[12px] text-coral">{idx}</span>
      <div className="min-w-0">
        <p className="text-[17px] font-bold leading-snug text-night-text">{name}</p>
        {detail && <p className="mt-1 font-mono text-[11.5px] tracking-[0.06em] text-night-sub break-words">{detail}</p>}
      </div>
      {mediaUrl ? (
        <button
          type="button"
          onClick={onPlay}
          aria-label={`Watch ${name} demo`}
          className="group relative ml-auto h-12 w-20 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-[#3A4A42] to-night-card2 transition-all duration-300 hover:brightness-125"
        >
          {mediaType === 'image' ? (
            <img src={mediaUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-80" />
          ) : (
            <video src={`${mediaUrl}#t=0.1`} muted playsInline preload="metadata" className="absolute inset-0 h-full w-full object-cover opacity-80" />
          )}
          <span className="absolute inset-0 flex items-center justify-center text-night-text">
            <PlayGlyph className="h-3 w-3" />
          </span>
        </button>
      ) : (
        <span
          aria-hidden
          className="ml-auto flex h-12 w-20 shrink-0 items-center justify-center rounded-xl border border-dashed border-night-line font-mono text-[8px] tracking-[0.12em] text-night-sub"
        >
          DEMO SOON
        </span>
      )}
    </div>
  );
}

export function ChatBubble({ who, children }: { who: 'you' | 'coach'; children: React.ReactNode }) {
  return who === 'you' ? (
    <div className="max-w-[90%] self-end rounded-2xl rounded-br-[5px] border border-coral/30 bg-coral/15 px-3.5 py-2.5 text-[13px] leading-relaxed text-night-text">
      {children}
    </div>
  ) : (
    <div className="max-w-[90%] self-start whitespace-pre-wrap rounded-2xl rounded-bl-[5px] border border-night-line bg-night-card2 px-3.5 py-2.5 text-[13px] leading-relaxed text-night-sub [&_b]:font-bold [&_b]:text-night-text">
      {children}
    </div>
  );
}

export function ChatShell({
  header,
  children,
  input,
  disclaimer,
}: {
  header: React.ReactNode;
  children: React.ReactNode;
  input: React.ReactNode;
  disclaimer?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[300px] flex-1 flex-col p-5 lg:min-h-0">
      <div className="mb-3.5 flex items-center gap-2 font-mono text-[9.5px] uppercase tracking-[0.2em] text-night-sub">
        <span className="h-1.5 w-1.5 rounded-full bg-sea shadow-[0_0_0_3px_rgba(47,107,100,0.25)]" />
        {header}
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1">{children}</div>
      {input}
      {disclaimer && (
        <p className="mt-2.5 text-center font-mono text-[8px] leading-relaxed tracking-[0.11em] text-night-sub/65">
          {disclaimer}
        </p>
      )}
    </div>
  );
}

export function ChatInput({
  value,
  onChange,
  onSend,
  disabled,
  placeholder = 'Ask about today’s workout…',
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="mt-3.5 flex items-center gap-2 rounded-full border border-night-line bg-night-card py-1.5 pl-5 pr-1.5">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSend();
          }
        }}
        disabled={disabled}
        placeholder={placeholder}
        className="w-full bg-transparent text-[13.5px] text-night-text outline-none disabled:opacity-50"
        aria-label="Message the coach"
      />
      <button
        type="button"
        onClick={onSend}
        disabled={disabled}
        aria-label="Send"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-coral text-[13px] text-night-bg transition-all duration-300 hover:brightness-110 disabled:opacity-50"
      >
        ↑
      </button>
    </div>
  );
}
