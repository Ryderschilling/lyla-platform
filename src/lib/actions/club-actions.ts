'use server';

import { z } from 'zod';
import { and, asc, eq, isNull, lte, or } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { db, schema } from '../db';
import { requireUser } from '../auth';
import { getAdmin, getUserStreak } from '../queries';
import { AGREEMENT_VERSION } from '../legal';

export async function completeWorkout(workoutId: string): Promise<{ ok: boolean; streak?: number; error?: string }> {
  const session = await requireUser();
  const parsed = z.string().uuid().safeParse(workoutId);
  if (!parsed.success) return { ok: false, error: 'Bad workout id' };

  const workout = await db.query.workouts.findFirst({
    where: and(
      eq(schema.workouts.id, workoutId),
      eq(schema.workouts.published, true),
      lte(schema.workouts.launchAt, new Date())
    ),
  });
  if (!workout) return { ok: false, error: "That workout hasn't dropped yet." };

  await db
    .insert(schema.completions)
    .values({ userId: session.id, workoutId })
    .onConflictDoNothing();

  const { current } = await getUserStreak(session.id);
  revalidatePath('/club');
  return { ok: true, streak: current };
}

const reviewSchema = z.object({
  workoutId: z.string().uuid(),
  difficulty: z.enum(['too_easy', 'just_right', 'too_hard']),
  favoriteMovementId: z.string().uuid().nullable().optional(),
  note: z.string().trim().max(2000).optional(),
});

export async function submitReview(input: z.infer<typeof reviewSchema>): Promise<{ ok: boolean; error?: string }> {
  const session = await requireUser();
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Check the review' };
  const { workoutId, difficulty, favoriteMovementId, note } = parsed.data;

  const done = await db.query.completions.findFirst({
    where: and(eq(schema.completions.userId, session.id), eq(schema.completions.workoutId, workoutId)),
  });
  if (!done) return { ok: false, error: 'Mark it complete first — then tell me how it went.' };

  await db
    .insert(schema.reviews)
    .values({ userId: session.id, workoutId, difficulty, favoriteMovementId: favoriteMovementId ?? null, note: note || null })
    .onConflictDoUpdate({
      target: [schema.reviews.userId, schema.reviews.workoutId],
      set: { difficulty, favoriteMovementId: favoriteMovementId ?? null, note: note || null },
    });
  revalidatePath('/club');
  return { ok: true };
}

export async function sendClubMessage(body: string): Promise<{ ok: boolean; error?: string }> {
  const session = await requireUser();
  const text = z.string().trim().min(1).max(4000).safeParse(body);
  if (!text.success) return { ok: false, error: 'Write something first' };
  const admin = await getAdmin();
  if (!admin) return { ok: false, error: 'Lyla is unreachable right now' };
  await db.insert(schema.messages).values({ senderId: session.id, recipientId: admin.id, body: text.data });
  return { ok: true };
}

/** Mark everything Lyla sent me as read. */
export async function markMyThreadRead(): Promise<void> {
  const session = await requireUser();
  await db
    .update(schema.messages)
    .set({ readAt: new Date() })
    .where(and(eq(schema.messages.recipientId, session.id), isNull(schema.messages.readAt)));
}

export type ThreadMessage = { id: string; mine: boolean; body: string; createdAt: string };

/** Full thread between me and Lyla, oldest first. Also marks her messages read. */
export async function getMyThread(): Promise<ThreadMessage[]> {
  const session = await requireUser();
  const admin = await getAdmin();
  if (!admin) return [];
  const rows = await db.query.messages.findMany({
    where: or(
      and(eq(schema.messages.senderId, session.id), eq(schema.messages.recipientId, admin.id)),
      and(eq(schema.messages.senderId, admin.id), eq(schema.messages.recipientId, session.id))
    ),
    orderBy: asc(schema.messages.createdAt),
  });
  await markMyThreadRead();
  return rows.map((m) => ({
    id: m.id,
    mine: m.senderId === session.id,
    body: m.body,
    createdAt: m.createdAt.toISOString(),
  }));
}

/* ---------------- first-login intake ---------------- */

const intakeSchema = z.object({
  age: z.coerce.number().int().min(13).max(100).optional().nullable(),
  heightFt: z.coerce.number().int().min(3).max(7).optional().nullable(),
  heightInches: z.coerce.number().int().min(0).max(11).optional().nullable(),
  weightLb: z.coerce.number().int().min(50).max(600).optional().nullable(),
  experience: z.enum(['brand_new', 'some', 'consistent', 'athlete']).optional().nullable(),
  daysPerWeek: z.coerce.number().int().min(1).max(7).optional().nullable(),
  goal: z.string().trim().max(600).optional().default(''),
  injuries: z.string().trim().max(1500).optional().default(''),
  equipment: z.string().trim().max(600).optional().default(''),
  anythingElse: z.string().trim().max(1500).optional().default(''),
  agreed: z.boolean(),
});

export type IntakePayload = z.input<typeof intakeSchema>;

/**
 * Saves the member's own answers. They can only ever write their OWN row.
 * The waiver checkbox is required to mark the intake complete — without it the
 * answers still save (so nothing is lost) but the gate stays closed.
 */
export async function saveIntake(input: IntakePayload): Promise<{ ok: boolean; error?: string }> {
  const session = await requireUser();
  const parsed = intakeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Check your answers' };
  const p = parsed.data;

  if (!p.agreed) return { ok: false, error: 'Please read and accept the member agreement to finish.' };

  const heightIn =
    p.heightFt != null ? p.heightFt * 12 + (p.heightInches ?? 0) : null;

  const now = new Date();
  const values = {
    age: p.age ?? null,
    heightIn,
    weightLb: p.weightLb ?? null,
    experience: p.experience ?? null,
    daysPerWeek: p.daysPerWeek ?? null,
    goal: p.goal || null,
    injuries: p.injuries || null,
    equipment: p.equipment || null,
    anythingElse: p.anythingElse || null,
    completedAt: now,
    agreedAt: now,
    agreedVersion: AGREEMENT_VERSION,
    agreedIp: headers().get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
    updatedAt: now,
  };

  await db
    .insert(schema.clientProfiles)
    .values({ userId: session.id, ...values })
    .onConflictDoUpdate({ target: schema.clientProfiles.userId, set: values });

  revalidatePath('/club');
  revalidatePath('/club/account');
  revalidatePath('/hq/clients');
  return { ok: true };
}

/** Later edits from /club/account — no re-consent, keeps the original agreement record. */
export async function updateMyProfile(input: Omit<IntakePayload, 'agreed'>): Promise<{ ok: boolean; error?: string }> {
  const session = await requireUser();
  const parsed = intakeSchema.omit({ agreed: true }).safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Check your answers' };
  const p = parsed.data;

  const existing = await db.query.clientProfiles.findFirst({
    where: eq(schema.clientProfiles.userId, session.id),
  });
  if (!existing?.completedAt) return { ok: false, error: 'Finish your welcome questions first.' };

  await db
    .update(schema.clientProfiles)
    .set({
      age: p.age ?? null,
      heightIn: p.heightFt != null ? p.heightFt * 12 + (p.heightInches ?? 0) : null,
      weightLb: p.weightLb ?? null,
      experience: p.experience ?? null,
      daysPerWeek: p.daysPerWeek ?? null,
      goal: p.goal || null,
      injuries: p.injuries || null,
      equipment: p.equipment || null,
      anythingElse: p.anythingElse || null,
      updatedAt: new Date(),
    })
    .where(eq(schema.clientProfiles.userId, session.id));

  revalidatePath('/club/account');
  revalidatePath('/hq/clients');
  return { ok: true };
}
