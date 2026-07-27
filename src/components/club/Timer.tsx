'use client';

import { useEffect, useRef, useState } from 'react';
import { beep, primeAudio } from '@/lib/beep';

type EmomCfg = { rounds: number; interval_sec: number; label?: string };

const SOUND_KEY = 'pc_timer_sound';

function fmt(ms: number): string {
  ms = Math.max(0, ms);
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

/**
 * The training-room clock: stopwatch + EMOM with configurable rounds × interval.
 * Fragment Mono digits, gold final-10s, round dots. The only thing in Focus Mode
 * allowed to demand attention.
 *
 * Audio: a near-silent tick every second so you know it's live, a sharper beep
 * for the last three seconds of an interval, a two-note rise on each round
 * rollover, and a three-note chime when the EMOM finishes. All synthesised —
 * see lib/beep.ts. Muteable, and the choice sticks per device.
 */
export function Timer({ emomDefault }: { emomDefault?: EmomCfg | null }) {
  const [mode, setMode] = useState<'sw' | 'emom'>(emomDefault ? 'emom' : 'sw');
  const [running, setRunning] = useState(false);
  const [acc, setAcc] = useState(0);
  const [now, setNow] = useState(0);
  const [rounds, setRounds] = useState(emomDefault?.rounds ?? 5);
  const [intervalSec, setIntervalSec] = useState(emomDefault?.interval_sec ?? 60);
  const [muted, setMuted] = useState(false);
  const t0 = useRef(0);
  const lastSec = useRef(-1);
  const lastRound = useRef(0);
  const chimed = useRef(false);

  // sound preference is per-device; read after mount so SSR markup matches
  useEffect(() => {
    try {
      setMuted(window.localStorage.getItem(SOUND_KEY) === 'off');
    } catch {
      /* private mode — just leave sound on */
    }
  }, []);

  const toggleSound = () => {
    setMuted((m) => {
      const next = !m;
      try {
        window.localStorage.setItem(SOUND_KEY, next ? 'off' : 'on');
      } catch {
        /* ignore */
      }
      if (!next) {
        primeAudio();
        beep.tick();
      }
      return next;
    });
  };

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setNow(Date.now()), 120);
    return () => clearInterval(id);
  }, [running]);

  const elapsed = acc + (running ? Math.max(0, now - t0.current) : 0);
  const totalMs = rounds * intervalSec * 1000;
  const intervalMs = intervalSec * 1000;
  const emomDone = mode === 'emom' && elapsed >= totalMs;
  const roundIdx = mode === 'emom' ? Math.min(Math.floor(elapsed / intervalMs), rounds - 1) : 0;
  const remaining = mode === 'emom' ? intervalMs - (elapsed % intervalMs) : 0;
  const golden = mode === 'emom' && (emomDone || remaining <= 10000);

  useEffect(() => {
    if (emomDone && running) {
      setAcc(totalMs);
      setRunning(false);
      if (!muted && !chimed.current) {
        chimed.current = true;
        beep.done();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emomDone]);

  // per-second tick / last-three-seconds countdown
  useEffect(() => {
    if (!running || muted || emomDone) return;
    const whole = Math.floor(elapsed / 1000);
    if (whole === lastSec.current) return;
    lastSec.current = whole;
    if (mode === 'emom') {
      // a rollover just happened — the round beep covers this second
      if (elapsed % intervalMs < 200) return;
      const left = Math.ceil(remaining / 1000);
      if (left > 0 && left <= 3) {
        beep.countdown();
        return;
      }
    }
    beep.tick();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elapsed, running, muted, mode, emomDone]);

  // round rollover
  useEffect(() => {
    if (!running || mode !== 'emom') {
      lastRound.current = roundIdx;
      return;
    }
    if (roundIdx === lastRound.current) return;
    lastRound.current = roundIdx;
    if (!muted && !emomDone) beep.round();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundIdx, running, mode, muted]);

  const start = () => {
    primeAudio(); // must happen inside the gesture or autoplay policy blocks audio
    if (running) {
      setAcc(elapsed);
      setRunning(false);
      return;
    }
    if (mode === 'emom' && acc >= totalMs) {
      setAcc(0);
      chimed.current = false;
      lastRound.current = 0;
    }
    lastSec.current = Math.floor(elapsed / 1000);
    t0.current = Date.now();
    setNow(Date.now());
    setRunning(true);
  };
  const reset = () => {
    setRunning(false);
    setAcc(0);
    lastSec.current = -1;
    lastRound.current = 0;
    chimed.current = false;
  };
  const switchMode = (m: 'sw' | 'emom') => {
    setMode(m);
    setRunning(false);
    setAcc(0);
    lastSec.current = -1;
    lastRound.current = 0;
    chimed.current = false;
  };

  const digits = mode === 'sw' ? fmt(elapsed) : emomDone ? '00:00' : fmt(remaining);
  const dotCount = Math.min(rounds, 12);
  const other =
    mode === 'sw'
      ? `Switch to EMOM ${rounds}×${fmt(intervalSec * 1000).replace(/^0/, '')}`
      : 'Switch to stopwatch';

  return (
    // container-type lets the digits size off THIS rail instead of the viewport.
    // 6.4vw read right in the 420px member rail and overflowed the narrow demo
    // rail on The Club page, which is what clipped the clock.
    <div className="min-w-0 border-b border-night-line px-4 py-6 text-center [container-type:inline-size] md:px-6 md:py-7">
      <div className="flex items-center justify-center gap-3">
        <p className="min-w-0 truncate font-mono text-[10px] uppercase tracking-[0.24em] text-night-sub">
          {mode === 'sw' ? 'STOPWATCH' : `EMOM · ${rounds} ROUNDS`}
        </p>
        <button
          type="button"
          onClick={toggleSound}
          aria-pressed={!muted}
          aria-label={muted ? 'Turn timer sound on' : 'Turn timer sound off'}
          title={muted ? 'Sound off' : 'Sound on'}
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-colors duration-300 ${
            muted ? 'border-night-line text-night-sub hover:text-night-text' : 'border-gold/45 text-gold'
          }`}
        >
          <SpeakerGlyph muted={muted} className="h-3.5 w-3.5" />
        </button>
      </div>
      <p
        className={`tab-nums mt-3 font-mono text-[clamp(40px,25cqw,76px)] leading-[0.95] tracking-[0.02em] transition-colors duration-300 ${
          golden ? 'text-gold' : 'text-night-text'
        }`}
      >
        {digits}
      </p>
      <p className="mt-2 h-4 truncate font-mono text-[10px] tracking-[0.2em] text-gold">
        {mode === 'emom' && (emomDone ? 'EMOM COMPLETE' : running || acc > 0 ? `ROUND ${roundIdx + 1}/${rounds}${emomDefault?.label ? ` — ${emomDefault.label}` : ''}` : '')}
      </p>
      {mode === 'emom' && (
        <div className="mb-4 mt-3.5 flex flex-wrap items-center justify-center gap-2">
          {Array.from({ length: dotCount }).map((_, i) => {
            const done = emomDone || i < roundIdx;
            return (
              <span
                key={i}
                className={`h-2 w-2 rounded-full border transition-colors duration-300 ${
                  done ? 'border-gold bg-gold' : i === roundIdx && (running || acc > 0) ? 'border-gold/70 bg-transparent' : 'border-night-line bg-night-card2'
                }`}
              />
            );
          })}
          {rounds > 12 && <span className="pl-1 font-mono text-[10px] text-night-sub">+{rounds - 12}</span>}
        </div>
      )}
      {/* the mute toggle moved up beside the mode label, because three pills in
          one row overflowed a narrow rail and clipped the speaker */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
        <button
          type="button"
          onClick={start}
          className="rounded-full bg-coral px-7 py-3.5 font-mono text-[11.5px] tracking-[0.18em] text-night-bg transition-all duration-300 hover:brightness-110"
        >
          {running ? 'PAUSE' : 'START'}
        </button>
        <button
          type="button"
          onClick={reset}
          className="rounded-full border border-night-line px-5 py-3.5 font-mono text-[11.5px] tracking-[0.18em] text-night-sub transition-colors duration-300 hover:text-night-text"
        >
          RESET
        </button>
      </div>
      {/* ONE toggle that names where it takes you. The old pair of segmented
          buttons gave the inactive mode a transparent border, so it read as dead
          text and looked like a one-way trip into the stopwatch. The label above
          the digits already says which mode you're in, so this can safely name
          the other one. */}
      <div className="mt-4 flex items-center justify-center">
        <button
          type="button"
          onClick={() => switchMode(mode === 'sw' ? 'emom' : 'sw')}
          title={other}
          aria-label={other}
          className="flex max-w-full items-center gap-2 rounded-full border border-night-line px-4 py-2.5 font-mono text-[9px] tracking-[0.14em] text-night-sub transition-colors duration-300 hover:border-coral/50 hover:text-coral"
        >
          <SwapGlyph className="h-3 w-3 shrink-0" />
          <span className="truncate">{other.toUpperCase()}</span>
        </button>
      </div>
      {mode === 'emom' && !running && acc === 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2.5 font-mono text-[10px] tracking-[0.12em] text-night-sub">
          <span className="flex items-center gap-2">
            RDS
            <button type="button" onClick={() => setRounds((r) => Math.max(1, r - 1))} className="h-6 w-6 rounded-full border border-night-line leading-none hover:text-night-text" aria-label="Fewer rounds">−</button>
            <span className="w-5 text-night-text">{rounds}</span>
            <button type="button" onClick={() => setRounds((r) => Math.min(30, r + 1))} className="h-6 w-6 rounded-full border border-night-line leading-none hover:text-night-text" aria-label="More rounds">+</button>
          </span>
          <span className="flex items-center gap-2">
            INT
            <button type="button" onClick={() => setIntervalSec((s) => Math.max(10, s - 10))} className="h-6 w-6 rounded-full border border-night-line leading-none hover:text-night-text" aria-label="Shorter interval">−</button>
            <span className="w-9 text-night-text">{fmt(intervalSec * 1000).replace(/^0/, '')}</span>
            <button type="button" onClick={() => setIntervalSec((s) => Math.min(600, s + 10))} className="h-6 w-6 rounded-full border border-night-line leading-none hover:text-night-text" aria-label="Longer interval">+</button>
          </span>
        </div>
      )}
    </div>
  );
}

function SwapGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M3 8h14l-3.5-3.5M21 16H7l3.5 3.5" />
    </svg>
  );
}

function SpeakerGlyph({ muted, className }: { muted: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M11 5 6.5 9H3v6h3.5L11 19V5Z" />
      {muted ? (
        <>
          <path d="M16 9.5l5 5" />
          <path d="M21 9.5l-5 5" />
        </>
      ) : (
        <>
          <path d="M15.5 8.8a4.5 4.5 0 0 1 0 6.4" />
          <path d="M18.4 6a8.5 8.5 0 0 1 0 12" />
        </>
      )}
    </svg>
  );
}
