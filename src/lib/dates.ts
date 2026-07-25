/** All "day" logic runs on America/Chicago — the Club's clock. */
export const CLUB_TZ = 'America/Chicago';

const dayFmt = new Intl.DateTimeFormat('en-CA', { timeZone: CLUB_TZ }); // YYYY-MM-DD

export function chiDay(d: Date = new Date()): string {
  return dayFmt.format(d);
}

export function addDays(day: string, n: number): string {
  const d = new Date(`${day}T12:00:00Z`); // noon avoids DST edges
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** "SAT · JUL 25 · DROPPED 5:00AM" */
export function dropStamp(launchAt: Date): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: CLUB_TZ, weekday: 'short', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  }).formatToParts(launchAt);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  const ampm = (get('dayPeriod') || '').toUpperCase().replace(/\./g, '');
  return `${get('weekday')} · ${get('month')} ${get('day')} · DROPPED ${get('hour')}:${get('minute')}${ampm}`.toUpperCase();
}

/** "JUL 25" style short stamp */
export function shortStamp(d: Date): string {
  return new Intl.DateTimeFormat('en-US', { timeZone: CLUB_TZ, month: 'short', day: 'numeric' })
    .format(d).toUpperCase();
}

export function fullStamp(d: Date): string {
  return new Intl.DateTimeFormat('en-US', { timeZone: CLUB_TZ, weekday: 'long', month: 'long', day: 'numeric' }).format(d);
}

/**
 * Streaks from the set of Chicago-days that have a completion.
 * Current streak counts back from today; an unfinished today doesn't break it
 * until the day is over (so we also allow the chain to start yesterday).
 */
export function computeStreaks(days: Set<string>): { current: number; best: number } {
  const today = chiDay();
  let current = 0;
  let cursor = days.has(today) ? today : addDays(today, -1);
  while (days.has(cursor)) {
    current += 1;
    cursor = addDays(cursor, -1);
  }
  // best: scan all
  const sorted = Array.from(days).sort();
  let best = 0, run = 0, prev: string | null = null;
  for (const d of sorted) {
    run = prev !== null && addDays(prev, 1) === d ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return { current, best };
}

/** Convert a Chicago-local date ("YYYY-MM-DD") + time ("HH:mm") to a UTC Date, DST-correct. */
export function chicagoToUtc(date: string, time: string): Date {
  const guess = new Date(`${date}T${time}:00Z`);
  const offset = tzOffsetMs(guess);
  const adjusted = new Date(guess.getTime() - offset);
  // second pass handles conversions that cross a DST boundary
  const offset2 = tzOffsetMs(adjusted);
  return offset2 === offset ? adjusted : new Date(guess.getTime() - offset2);
}

function tzOffsetMs(at: Date): number {
  const zone = new Intl.DateTimeFormat('en-US', {
    timeZone: CLUB_TZ, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).formatToParts(at);
  const get = (t: string) => Number(zone.find((p) => p.type === t)?.value);
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour') % 24, get('minute'), get('second'));
  return asUtc - at.getTime();
}

/** Chicago-local parts of an instant, for datetime-local inputs in HQ. */
export function utcToChicagoParts(d: Date): { date: string; time: string } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: CLUB_TZ, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  return { date: `${get('year')}-${get('month')}-${get('day')}`, time: `${get('hour')}:${get('minute')}` };
}

/** Default next drop: tomorrow 5:00 AM Chicago. */
export function nextDropDefault(): { date: string; time: string } {
  return { date: addDays(chiDay(), 1), time: '05:00' };
}
