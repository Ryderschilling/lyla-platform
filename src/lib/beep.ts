/**
 * Tiny WebAudio beeper for the training-room clock.
 *
 * No audio files and no network — every sound is synthesised, so it works
 * offline, adds zero bytes to the bundle payload, and never 404s on deploy.
 *
 * The AudioContext is created lazily on the first call, which must happen
 * inside a user gesture (the START button) or browser autoplay policy blocks
 * it silently. `primeAudio()` exists for exactly that.
 */

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor: typeof AudioContext | undefined =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null; // very old browser — silently go quiet, never throw
  try {
    if (!ctx) ctx = new Ctor();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

/** Call inside a click handler before the first sound so iOS/Chrome allow audio. */
export function primeAudio(): void {
  audio();
}

type Tone = { freq: number; ms: number; gain: number; type?: OscillatorType };

function tone({ freq, ms, gain, type = 'sine' }: Tone, delayMs = 0): void {
  const ac = audio();
  if (!ac) return;
  const at = ac.currentTime + delayMs / 1000;
  const osc = ac.createOscillator();
  const amp = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, at);
  // short attack + exponential release = a clock click, not a speaker pop
  amp.gain.setValueAtTime(0.0001, at);
  amp.gain.linearRampToValueAtTime(gain, at + 0.006);
  amp.gain.exponentialRampToValueAtTime(0.0001, at + ms / 1000);
  osc.connect(amp).connect(ac.destination);
  osc.start(at);
  osc.stop(at + ms / 1000 + 0.03);
}

export const beep = {
  /** Every second while running. Deliberately near-subliminal. */
  tick: () => tone({ freq: 1150, ms: 32, gain: 0.045, type: 'triangle' }),
  /** Last three seconds of an interval — "get ready". */
  countdown: () => tone({ freq: 1500, ms: 80, gain: 0.11, type: 'triangle' }),
  /** A round rolled over. Two-note rise so it reads as "go" from across the room. */
  round: () => {
    tone({ freq: 880, ms: 120, gain: 0.17 });
    tone({ freq: 1320, ms: 150, gain: 0.15 }, 120);
  },
  /** The whole EMOM finished. */
  done: () => {
    tone({ freq: 660, ms: 200, gain: 0.18 }, 0);
    tone({ freq: 880, ms: 200, gain: 0.18 }, 190);
    tone({ freq: 1320, ms: 380, gain: 0.2 }, 380);
  },
};
