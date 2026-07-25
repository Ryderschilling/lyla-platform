'use server';

import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { and, asc, eq, isNull, notInArray, sql as dsql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db, schema } from '../db';
import { requireAdmin } from '../auth';
import { chicagoToUtc } from '../dates';

export type FormState = { error?: string; ok?: boolean };

/* ---------------- clients ---------------- */

/** Dollars in the UI, cents in the database. Accepts "39", "39.00", "$39". */
const priceDollars = z
  .union([z.string(), z.number()])
  .optional()
  .transform((v) => (v === undefined || v === '' ? 0 : Number(String(v).replace(/[^0-9.]/g, ''))))
  .refine((n) => Number.isFinite(n) && n >= 0 && n <= 10000, 'Price must be between $0 and $10,000')
  .transform((n) => Math.round(n * 100));

const newClientSchema = z.object({
  fullName: z.string().trim().min(2, 'Name, please').max(80),
  email: z.string().trim().toLowerCase().email('Real email needed'),
  password: z.string().min(8, 'Password needs 8+ characters'),
  price: priceDollars,
});

export async function createClient(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = newClientSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Check the form' };
  const { fullName, email, password, price } = parsed.data;

  const existing = await db.query.users.findFirst({ where: eq(schema.users.email, email) });
  if (existing) return { error: 'That email already has a login.' };

  await db.insert(schema.users).values({
    fullName,
    email,
    passwordHash: bcrypt.hashSync(password, 10),
    role: 'client',
    monthlyPriceCents: price,
    startedAt: new Date(),
  });
  revalidatePath('/hq/clients');
  revalidatePath('/hq');
  return { ok: true };
}

export async function setClientActive(userId: string, active: boolean) {
  await requireAdmin();
  await db.update(schema.users).set({ active }).where(and(eq(schema.users.id, userId), eq(schema.users.role, 'client')));
  revalidatePath('/hq/clients');
  revalidatePath('/hq');
}

export async function resetClientPassword(userId: string, newPassword: string): Promise<FormState> {
  await requireAdmin();
  if (newPassword.length < 8) return { error: 'Password needs 8+ characters' };
  await db
    .update(schema.users)
    .set({ passwordHash: bcrypt.hashSync(newPassword, 10) })
    .where(and(eq(schema.users.id, userId), eq(schema.users.role, 'client')));
  return { ok: true };
}

const updateClientSchema = z.object({
  id: z.string().uuid(),
  fullName: z.string().trim().min(2, 'Name, please').max(80),
  email: z.string().trim().toLowerCase().email('Real email needed'),
  phone: z.string().trim().max(40).optional().default(''),
  price: priceDollars,
  notes: z.string().trim().max(2000).optional().default(''),
  active: z.boolean(),
  startedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Pick a start date').or(z.literal('')).optional(),
});

export type ClientPatch = z.input<typeof updateClientSchema>;

export async function updateClient(input: ClientPatch): Promise<FormState> {
  await requireAdmin();
  const parsed = updateClientSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Check the form' };
  const c = parsed.data;

  const target = await db.query.users.findFirst({ where: eq(schema.users.id, c.id) });
  if (!target || target.role !== 'client') return { error: 'That client no longer exists.' };

  if (c.email !== target.email) {
    const clash = await db.query.users.findFirst({ where: eq(schema.users.email, c.email) });
    if (clash) return { error: 'Another login already uses that email.' };
  }

  await db
    .update(schema.users)
    .set({
      fullName: c.fullName,
      email: c.email,
      phone: c.phone || null,
      notes: c.notes || null,
      monthlyPriceCents: c.price,
      active: c.active,
      startedAt: c.startedAt ? chicagoToUtc(c.startedAt, '12:00') : target.startedAt,
    })
    .where(and(eq(schema.users.id, c.id), eq(schema.users.role, 'client')));

  revalidatePath('/hq/clients');
  revalidatePath('/hq');
  revalidatePath('/hq/messages');
  return { ok: true };
}

const intakeEditSchema = z.object({
  userId: z.string().uuid(),
  coachContext: z.string().trim().max(2000).optional().default(''),
  injuries: z.string().trim().max(1500).optional().default(''),
  goal: z.string().trim().max(600).optional().default(''),
  equipment: z.string().trim().max(600).optional().default(''),
  anythingElse: z.string().trim().max(1500).optional().default(''),
});

export type IntakeEdit = z.input<typeof intakeEditSchema>;

/**
 * Lyla's edits to the coaching side of a client's profile — including the
 * "what the coach should know" note. Everything saved here IS sent to the AI.
 * Her private notes live on users.notes and are never loaded by the coach route.
 */
export async function updateClientCoaching(input: IntakeEdit): Promise<FormState> {
  await requireAdmin();
  const parsed = intakeEditSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Check the form' };
  const c = parsed.data;

  const target = await db.query.users.findFirst({ where: eq(schema.users.id, c.userId) });
  if (!target || target.role !== 'client') return { error: 'That client no longer exists.' };

  const values = {
    coachContext: c.coachContext || null,
    injuries: c.injuries || null,
    goal: c.goal || null,
    equipment: c.equipment || null,
    anythingElse: c.anythingElse || null,
    updatedAt: new Date(),
  };

  await db
    .insert(schema.clientProfiles)
    .values({ userId: c.userId, ...values })
    .onConflictDoUpdate({ target: schema.clientProfiles.userId, set: values });

  revalidatePath('/hq/clients');
  return { ok: true };
}

/** Hard delete — cascades their completions, reviews and messages. */
export async function deleteClient(userId: string): Promise<FormState> {
  await requireAdmin();
  const target = await db.query.users.findFirst({ where: eq(schema.users.id, userId) });
  if (!target) return { error: 'Already gone.' };
  if (target.role !== 'client') return { error: 'That account is not a client.' };
  await db.delete(schema.users).where(eq(schema.users.id, userId));
  revalidatePath('/hq/clients');
  revalidatePath('/hq');
  revalidatePath('/hq/messages');
  return { ok: true };
}

/* ---------------- workouts ---------------- */

const movementSchema = z.object({
  id: z.string().uuid().optional(),
  groupLabel: z.string().trim().max(60).optional().default(''),
  name: z.string().trim().min(1, 'Every movement needs a name').max(80),
  detail: z.string().trim().max(120).optional().default(''),
  mediaUrl: z.string().trim().max(500).optional().default(''),
  mediaType: z.enum(['video', 'image']).nullable().optional(),
});

const workoutSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(2, 'Give it a title').max(120),
  subtitle: z.string().trim().max(120).optional().default(''),
  coachNote: z.string().trim().max(2000).optional().default(''),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Pick a launch date'),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Pick a launch time'),
  published: z.boolean(),
  timer: z.object({
    mode: z.enum(['none', 'emom']),
    rounds: z.coerce.number().int().min(1).max(60).optional(),
    intervalSec: z.coerce.number().int().min(10).max(600).optional(),
    label: z.string().trim().max(40).optional(),
  }),
  movements: z.array(movementSchema).min(1, 'Add at least one movement'),
});

export type WorkoutPayload = z.infer<typeof workoutSchema>;

export async function saveWorkout(input: WorkoutPayload): Promise<{ ok: boolean; id?: string; error?: string }> {
  await requireAdmin();
  const parsed = workoutSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Check the form' };
  const w = parsed.data;

  const launchAt = chicagoToUtc(w.date, w.time);
  const timerConfig =
    w.timer.mode === 'emom'
      ? { emom: { rounds: w.timer.rounds ?? 5, interval_sec: w.timer.intervalSec ?? 60, label: w.timer.label || undefined } }
      : {};

  let workoutId = w.id;
  if (workoutId) {
    await db
      .update(schema.workouts)
      .set({ title: w.title, subtitle: w.subtitle || null, coachNote: w.coachNote || null, launchAt, timerConfig, published: w.published })
      .where(eq(schema.workouts.id, workoutId));
  } else {
    const [row] = await db
      .insert(schema.workouts)
      .values({ title: w.title, subtitle: w.subtitle || null, coachNote: w.coachNote || null, launchAt, timerConfig, published: w.published })
      .returning({ id: schema.workouts.id });
    workoutId = row.id;
  }

  // reconcile movements: delete removed, upsert the rest with fresh seq
  const keepIds = w.movements.map((m) => m.id).filter(Boolean) as string[];
  if (keepIds.length) {
    await db.delete(schema.movements).where(and(eq(schema.movements.workoutId, workoutId), notInArray(schema.movements.id, keepIds)));
  } else {
    await db.delete(schema.movements).where(eq(schema.movements.workoutId, workoutId));
  }
  for (let i = 0; i < w.movements.length; i++) {
    const m = w.movements[i];
    const values = {
      workoutId,
      groupLabel: m.groupLabel || null,
      seq: i + 1,
      name: m.name,
      detail: m.detail || null,
      mediaUrl: m.mediaUrl || null,
      mediaType: m.mediaUrl ? (m.mediaType ?? guessMediaType(m.mediaUrl)) : null,
    };
    if (m.id) {
      await db.update(schema.movements).set(values).where(eq(schema.movements.id, m.id));
    } else {
      await db.insert(schema.movements).values(values);
    }
  }

  revalidatePath('/hq/builder');
  revalidatePath('/hq/calendar');
  revalidatePath('/club');
  return { ok: true, id: workoutId };
}

function guessMediaType(url: string): 'video' | 'image' {
  return /\.(mp4|webm|mov)(\?|$)/i.test(url) ? 'video' : 'image';
}

export async function deleteWorkout(id: string) {
  await requireAdmin();
  await db.delete(schema.workouts).where(eq(schema.workouts.id, id));
  revalidatePath('/hq/builder');
  revalidatePath('/hq/calendar');
}

/* ---------------- referral codes ---------------- */

const codeSchema = z.object({
  id: z.string().uuid().optional(),
  brand: z.string().trim().min(1).max(60),
  code: z.string().trim().min(1).max(40),
  url: z.string().trim().url('Full link, with https://').or(z.literal('')).optional(),
  blurb: z.string().trim().max(200).optional().default(''),
  sort: z.coerce.number().int().min(1).max(999).default(1),
});

/**
 * `sort` is a POSITION, not a free-form number. Whatever you type, the whole
 * Locker is renumbered 1..n around it — so setting something to 1 pushes
 * everything else down instead of leaving two 1s behind.
 *
 * @param pinnedId  the row the user just placed
 * @param position  1-based slot it should land in
 */
async function resequenceCodes(pinnedId: string, position: number) {
  const all = await db.query.referralCodes.findMany({
    orderBy: [asc(schema.referralCodes.sort), asc(schema.referralCodes.createdAt)],
  });
  const pinned = all.find((c) => c.id === pinnedId);
  if (!pinned) return;

  const rest = all.filter((c) => c.id !== pinnedId);
  const slot = Math.min(Math.max(position, 1), rest.length + 1) - 1; // clamp, then 0-based
  const ordered = [...rest.slice(0, slot), pinned, ...rest.slice(slot)];

  const changed = ordered
    .map((c, i) => ({ id: c.id, sort: i + 1, was: c.sort }))
    .filter((r) => r.sort !== r.was);
  if (!changed.length) return;

  // one atomic statement — no half-renumbered Locker if a round trip drops
  await db.execute(
    dsql`update referral_codes set sort = (case id ${dsql.join(
      changed.map((r) => dsql`when ${r.id}::uuid then ${r.sort}::int`),
      dsql` `
    )} end) where id in (${dsql.join(
      changed.map((r) => dsql`${r.id}::uuid`),
      dsql`, `
    )})`
  );
}

export async function saveReferralCode(input: z.infer<typeof codeSchema>): Promise<FormState> {
  await requireAdmin();
  const parsed = codeSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Check the code' };
  const c = parsed.data;
  const values = { brand: c.brand, code: c.code, url: c.url || null, blurb: c.blurb || null, sort: c.sort };

  let id = c.id;
  if (id) {
    await db.update(schema.referralCodes).set(values).where(eq(schema.referralCodes.id, id));
  } else {
    const [row] = await db.insert(schema.referralCodes).values(values).returning({ id: schema.referralCodes.id });
    id = row.id;
  }
  await resequenceCodes(id, c.sort);

  revalidatePath('/hq/locker');
  revalidatePath('/locker');
  revalidatePath('/club/locker');
  return { ok: true };
}

/** Nudge a code one slot up or down and renumber everything around it. */
export async function moveReferralCode(id: string, direction: 'up' | 'down'): Promise<FormState> {
  await requireAdmin();
  const all = await db.query.referralCodes.findMany({
    orderBy: [asc(schema.referralCodes.sort), asc(schema.referralCodes.createdAt)],
  });
  const idx = all.findIndex((c) => c.id === id);
  if (idx === -1) return { error: 'That code is gone.' };
  const target = direction === 'up' ? idx : idx + 2; // 1-based slot after removal
  await resequenceCodes(id, target);
  revalidatePath('/hq/locker');
  revalidatePath('/locker');
  revalidatePath('/club/locker');
  return { ok: true };
}

export async function deleteReferralCode(id: string) {
  await requireAdmin();
  await db.delete(schema.referralCodes).where(eq(schema.referralCodes.id, id));
  // close the gap the delete left behind
  const remaining = await db.query.referralCodes.findMany({
    orderBy: [asc(schema.referralCodes.sort), asc(schema.referralCodes.createdAt)],
  });
  if (remaining.length) await resequenceCodes(remaining[0].id, 1);
  revalidatePath('/hq/locker');
  revalidatePath('/locker');
  revalidatePath('/club/locker');
}

/* ---------------- messages ---------------- */

export async function replyToClient(userId: string, body: string): Promise<FormState> {
  const admin = await requireAdmin();
  const text = z.string().trim().min(1).max(4000).safeParse(body);
  if (!text.success) return { error: 'Write something first' };
  await db.insert(schema.messages).values({ senderId: admin.id, recipientId: userId, body: text.data });
  revalidatePath('/hq/messages');
  return { ok: true };
}

export async function markThreadRead(clientId: string | null) {
  const admin = await requireAdmin();
  if (clientId) {
    await db
      .update(schema.messages)
      .set({ readAt: new Date() })
      .where(and(eq(schema.messages.recipientId, admin.id), eq(schema.messages.senderId, clientId), isNull(schema.messages.readAt)));
  } else {
    await db
      .update(schema.messages)
      .set({ readAt: new Date() })
      .where(and(eq(schema.messages.recipientId, admin.id), isNull(schema.messages.senderId), isNull(schema.messages.readAt)));
  }
  revalidatePath('/hq/messages');
}
