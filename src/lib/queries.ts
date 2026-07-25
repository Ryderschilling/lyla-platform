import { and, desc, eq, lte, isNull, sql as dsql } from 'drizzle-orm';
import { db, schema } from './db';
import { chiDay, computeStreaks } from './dates';
import type { Movement } from './schema';

export async function getLaunchedWorkouts() {
  return db.query.workouts.findMany({
    where: and(eq(schema.workouts.published, true), lte(schema.workouts.launchAt, new Date())),
    orderBy: desc(schema.workouts.launchAt),
  });
}

export async function getTodayWorkout() {
  return db.query.workouts.findFirst({
    where: and(eq(schema.workouts.published, true), lte(schema.workouts.launchAt, new Date())),
    orderBy: desc(schema.workouts.launchAt),
    with: { movements: { orderBy: (m, { asc }) => [asc(m.seq)] } },
  });
}

/** Launched + published only — what members are allowed to open. */
export async function getLaunchedWorkoutWithMovements(id: string) {
  return db.query.workouts.findFirst({
    where: and(
      eq(schema.workouts.id, id),
      eq(schema.workouts.published, true),
      lte(schema.workouts.launchAt, new Date())
    ),
    with: { movements: { orderBy: (m, { asc }) => [asc(m.seq)] } },
  });
}

export async function getUserCompletionDays(userId: string): Promise<Set<string>> {
  const rows = await db
    .select({ at: schema.completions.completedAt })
    .from(schema.completions)
    .where(eq(schema.completions.userId, userId));
  return new Set(rows.map((r) => chiDay(r.at)));
}

/**
 * Stamps today as a day this member showed up. Idempotent by primary key, so
 * call it as often as you like — log out and back in ten times and it is still
 * one day. Returns silently on failure: a dead write must never block the page.
 *
 * Called from the (club) layout (every authenticated club view) rather than only
 * from the login action, because the session cookie lasts 30 days. A member who
 * never signs out would otherwise never fire another "login" and their streak
 * would freeze while they trained daily.
 */
export async function touchActiveDay(userId: string): Promise<void> {
  try {
    await db.insert(schema.activeDays).values({ userId, day: chiDay() }).onConflictDoNothing();
  } catch {
    /* never break a page load over a streak stamp */
  }
}

/** Chicago days this member showed up at all — the basis for every streak. */
export async function getUserActiveDays(userId: string): Promise<Set<string>> {
  try {
    const rows = await db
      .select({ day: schema.activeDays.day })
      .from(schema.activeDays)
      .where(eq(schema.activeDays.userId, userId));
    return new Set(rows.map((r) => r.day));
  } catch (err) {
    if (missingActiveDaysTable(err)) {
      console.warn('[streaks] active_days table is missing — run `npm run db:migrate` (0004). Showing 0 until then.');
      return new Set();
    }
    throw err; // any other db failure is a real bug, not something to paper over
  }
}

/** Narrow guard: only "relation does not exist" degrades. Everything else rethrows. */
function missingActiveDaysTable(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /active_days/.test(msg) && /does not exist|undefined_table|relation/i.test(msg);
}

/** All Chicago days across every member, for the HQ dashboard. One query, not N. */
export async function getActiveDaysByUser(): Promise<Map<string, Set<string>>> {
  const byUser = new Map<string, Set<string>>();
  let rows: Array<{ userId: string; day: string }> = [];
  try {
    rows = await db.select({ userId: schema.activeDays.userId, day: schema.activeDays.day }).from(schema.activeDays);
  } catch (err) {
    if (!missingActiveDaysTable(err)) throw err;
    console.warn('[streaks] active_days table is missing — run `npm run db:migrate` (0004).');
    return byUser;
  }
  for (const r of rows) {
    if (!byUser.has(r.userId)) byUser.set(r.userId, new Set());
    byUser.get(r.userId)!.add(r.day);
  }
  return byUser;
}

/** Streaks are SHOWING UP, not finishing workouts. See activeDays in schema.ts. */
export async function getUserStreak(userId: string) {
  return computeStreaks(await getUserActiveDays(userId));
}

export async function getAdmin() {
  return db.query.users.findFirst({ where: eq(schema.users.role, 'admin') });
}

export type MovementGroup = { label: string | null; moves: Array<Movement & { idx: string }> };

/** Packet-style A1/A2/B1/C indexing derived from groups. */
export function groupMovements(movements: Movement[]): MovementGroup[] {
  const ordered = [...movements].sort((a, b) => a.seq - b.seq);
  const groups: MovementGroup[] = [];
  for (const m of ordered) {
    const last = groups[groups.length - 1];
    if (!last || (last.label ?? '') !== (m.groupLabel ?? '')) {
      groups.push({ label: m.groupLabel, moves: [m as any] });
    } else {
      last.moves.push(m as any);
    }
  }
  const ALPHA = 'ABCDEFGH';
  groups.forEach((g, gi) => {
    const letter = ALPHA[gi] ?? 'X';
    g.moves = g.moves.map((m, i) => ({ ...m, idx: g.moves.length === 1 ? letter : `${letter}${i + 1}` }));
  });
  return groups;
}

export async function getUnreadCountForAdmin(adminId: string): Promise<number> {
  const [row] = await db
    .select({ n: dsql<number>`count(*)::int` })
    .from(schema.messages)
    .where(and(eq(schema.messages.recipientId, adminId), isNull(schema.messages.readAt)));
  return row?.n ?? 0;
}
