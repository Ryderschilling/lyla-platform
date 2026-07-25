'use client';

import { useState } from 'react';
import { DEMO_WORKOUT, DEMO_GREETING, demoCoachReply } from '@/lib/demo';
import { Timer } from '../club/Timer';
import { GroupLabel, MovementRow, ChatBubble, ChatShell, ChatInput } from '../club/room-pieces';
import { AI_DISCLAIMER_SHORT } from '@/lib/legal';
import { SunMark, RiseMark } from '../ui/marks';
import { chiDay, chicagoToUtc, dropStamp } from '@/lib/dates';

/**
 * Read-only training room demo for The Club page.
 * Timer really runs; chat runs on the canned demo brain — no API, no login.
 */
export function DemoRoom() {
  const [msgs, setMsgs] = useState<Array<{ who: 'you' | 'coach'; text: string }>>([
    { who: 'coach', text: DEMO_GREETING },
  ]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);

  const send = () => {
    const v = input.trim();
    if (!v || thinking) return;
    setInput('');
    setMsgs((m) => [...m, { who: 'you', text: v }]);
    setThinking(true);
    setTimeout(() => {
      setMsgs((m) => [...m, { who: 'coach', text: demoCoachReply(v) }]);
      setThinking(false);
    }, 700);
  };

  const stamp = dropStamp(chicagoToUtc(chiDay(), '05:00'));

  return (
    <div className="theme-dark overflow-hidden rounded-2xl border border-[rgba(20,30,26,0.9)] bg-night-bg text-night-text shadow-[0_46px_100px_-48px_rgba(20,30,26,0.75)]">
      {/* top bar */}
      <div className="flex items-center gap-3.5 border-b border-night-line px-5 py-3.5">
        <span className="flex items-center gap-2.5 font-mono text-[9.5px] tracking-[0.26em] text-night-text">
          <SunMark className="h-4 w-4 text-coral" />
          THE PROGRESS CLUB
        </span>
        <span className="ml-auto flex items-center gap-2 whitespace-nowrap rounded-full border border-gold/35 px-3 py-1.5 font-mono text-[9px] tracking-[0.18em] text-gold">
          <RiseMark className="h-3 w-3" />
          DAY 12
        </span>
        <span className="h-7 w-7 rounded-full border border-night-line bg-gradient-to-br from-coral to-gold" />
      </div>

      <div className="grid lg:grid-cols-[170px_1fr_260px]">
        {/* rail */}
        <nav className="flex gap-1 overflow-x-auto border-b border-night-line p-3 lg:flex-col lg:border-b-0 lg:border-r lg:p-3.5" aria-label="Demo navigation">
          {["TODAY'S WOD", 'PAST WORKOUTS', 'MY PROGRESS', 'MESSAGE LYLA', 'LEAVE A REVIEW'].map((item, i) => (
            <span
              key={item}
              className={`flex shrink-0 items-center gap-2 rounded-[10px] px-3 py-2.5 font-mono text-[9.5px] tracking-[0.12em] ${
                i === 0 ? 'bg-night-card2 text-night-text' : 'text-night-sub'
              }`}
            >
              {i === 0 && <span className="h-[5px] w-[5px] rounded-full bg-coral" />}
              {item}
            </span>
          ))}
        </nav>

        {/* main */}
        <div className="min-w-0 p-5 md:p-6">
          <p className="flex items-center gap-2 font-mono text-[9.5px] tracking-[0.24em] text-coral">
            <RiseMark className="h-3.5 w-3.5" />
            {stamp}
          </p>
          <h3 className="mt-2.5 font-display text-[clamp(24px,3vw,34px)] font-normal leading-tight text-night-text">
            {DEMO_WORKOUT.title}
          </h3>
          <p className="mb-4 mt-1 text-[12px] text-night-sub">{DEMO_WORKOUT.coachNote}</p>
          <div className="flex flex-col gap-2.5">
            {DEMO_WORKOUT.groups.map((g) => (
              <div key={g.label} className="flex flex-col gap-2.5">
                <GroupLabel>{g.label}</GroupLabel>
                {g.moves.map((m) => (
                  <MovementRow key={m.idx} idx={m.idx} name={m.name} detail={m.detail} />
                ))}
              </div>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-3.5">
            <span className="cursor-not-allowed rounded-full bg-coral/70 px-5 py-3 font-mono text-[10px] tracking-[0.16em] text-night-bg">
              MARK COMPLETE →
            </span>
            <span className="font-mono text-[8.5px] tracking-[0.14em] text-night-sub">MEMBERS ONLY — THIS ONE&apos;S A PREVIEW</span>
          </div>
        </div>

        {/* side rail */}
        <aside className="flex flex-col border-t border-night-line lg:border-l lg:border-t-0">
          <Timer emomDefault={DEMO_WORKOUT.timer.emom} />
          <ChatShell
            header="ASK COACH — KNOWS TODAY'S WOD"
            input={<ChatInput value={input} onChange={setInput} onSend={send} disabled={thinking} />}
            disclaimer={AI_DISCLAIMER_SHORT.toUpperCase()}
          >
            {msgs.map((m, i) => (
              <ChatBubble key={i} who={m.who}>
                {m.text}
              </ChatBubble>
            ))}
            {thinking && <ChatBubble who="coach">…</ChatBubble>}
          </ChatShell>
        </aside>
      </div>
    </div>
  );
}
