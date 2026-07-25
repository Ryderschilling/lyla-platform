'use client';

import Link from 'next/link';
import { useState } from 'react';

type Item = { id: string; title: string; day: string; published: boolean };

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function CalendarGrid({ items, today }: { items: Item[]; today: string }) {
  const [ty, tm] = today.split('-').map(Number);
  const [year, setYear] = useState(ty);
  const [month, setMonth] = useState(tm); // 1-based

  const prev = () => (month === 1 ? (setMonth(12), setYear(year - 1)) : setMonth(month - 1));
  const next = () => (month === 12 ? (setMonth(1), setYear(year + 1)) : setMonth(month + 1));

  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const firstDow = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const mkDay = (d: number) => `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  const byDay = new Map<string, Item[]>();
  for (const it of items) {
    if (!byDay.has(it.day)) byDay.set(it.day, []);
    byDay.get(it.day)!.push(it);
  }

  const allDays = Array.from({ length: daysInMonth }, (_, i) => mkDay(i + 1));
  const scheduledDays = allDays.filter((d) => byDay.get(d)?.some((w) => w.published)).length;
  // a day holding only unpublished work isn't "open" — it just isn't live yet
  const draftDays = allDays.filter((d) => {
    const items = byDay.get(d);
    return items?.length && !items.some((w) => w.published);
  }).length;
  const open = daysInMonth - scheduledDays - draftDays;

  const cells: Array<{ day: number | null; key: string }> = [];
  for (let i = 0; i < firstDow; i++) cells.push({ day: null, key: `off-${i}` });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, key: mkDay(d) });

  return (
    <div className="rounded-2xl border border-line bg-card p-5 md:p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-normal">
          {MONTHS[month - 1]} {year}
        </h2>
        <div className="flex gap-1.5">
          <button type="button" onClick={prev} aria-label="Previous month" className="h-8 w-8 rounded-full border border-line text-[12px] text-ink2 transition-colors hover:border-coral hover:text-coral">←</button>
          <button type="button" onClick={next} aria-label="Next month" className="h-8 w-8 rounded-full border border-line text-[12px] text-ink2 transition-colors hover:border-coral hover:text-coral">→</button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1.5">
        {DOW.map((d, i) => (
          <span key={`${d}-${i}`} className="pb-1 text-center font-mono text-[8.5px] tracking-[0.1em] text-mute">
            {d}
          </span>
        ))}
        {cells.map((c) => {
          if (c.day === null) return <span key={c.key} />;
          const dayStr = c.key;
          const dayItems = byDay.get(dayStr) ?? [];
          const hasPublished = dayItems.some((w) => w.published);
          const hasDraft = dayItems.some((w) => !w.published);
          const isToday = dayStr === today;
          const href =
            dayItems.length === 1 ? `/hq/builder/${dayItems[0].id}` : dayItems.length > 1 ? '/hq/builder' : `/hq/builder/new?date=${dayStr}`;
          // The fill IS the signal now: solid coral = a workout is live that day,
          // washed coral = built but not published, bare = nothing there yet.
          const fill = hasPublished
            ? 'border-coral bg-coral text-card font-bold hover:border-corald hover:bg-corald'
            : hasDraft
              ? 'border-coral/50 bg-coral/25 font-bold text-corald hover:border-coral hover:bg-coral/35'
              : 'border-line2 bg-shell text-ink2 hover:border-coral';

          return (
            <Link
              key={c.key}
              href={href}
              title={dayItems.map((w) => w.title).join(' · ') || 'Open — build a workout'}
              className={`relative flex aspect-square flex-col items-center justify-center rounded-lg border font-mono text-[11px] transition-all duration-300 hover:-translate-y-0.5 ${fill} ${
                isToday ? 'ring-2 ring-gold ring-offset-2 ring-offset-card' : ''
              }`}
            >
              {c.day}
              {dayItems.length > 1 && (
                <span
                  className={`absolute bottom-1 font-mono text-[7.5px] tracking-[0.06em] sm:bottom-1.5 ${
                    hasPublished ? 'text-card/85' : 'text-corald/80'
                  }`}
                >
                  ×{dayItems.length}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[8.5px] uppercase tracking-[0.14em] text-mute">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded border border-coral bg-coral" />
          {scheduledDays} scheduled
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded border border-coral/50 bg-coral/25" />
          {draftDays} draft
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded border border-line2 bg-shell" />
          {open} open
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded ring-2 ring-gold" />
          today
        </span>
      </div>
      <p className="mt-2 font-mono text-[8.5px] uppercase tracking-[0.14em] text-mute/70">
        Tap an empty day to build its workout
      </p>
    </div>
  );
}
