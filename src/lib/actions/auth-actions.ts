'use server';

import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { db, schema } from '../db';
import { SESSION_COOKIE, createSessionToken, sessionCookieOptions, requireUser } from '../auth';

export type FormState = { error?: string; ok?: boolean };

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a real email'),
  password: z.string().min(1, 'Enter your password'),
  next: z.string().optional(),
});

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Check your details' };
  const { email, password, next } = parsed.data;

  const user = await db.query.users.findFirst({ where: eq(schema.users.email, email) });
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return { error: "That email + password combo isn't ringing a bell. Try again?" };
  }
  if (!user.active) {
    return { error: 'This account is paused. Message Lyla to get back in.' };
  }

  const token = await createSessionToken({ id: user.id, role: user.role, name: user.fullName, email: user.email });
  cookies().set(SESSION_COOKIE, token, sessionCookieOptions());

  const dest = next && next.startsWith('/') && !next.startsWith('//') ? next : user.role === 'admin' ? '/hq' : '/club';
  redirect(dest);
}

export async function logout() {
  cookies().delete(SESSION_COOKIE);
  redirect('/');
}

const pwSchema = z.object({
  current: z.string().min(1, 'Enter your current password'),
  next: z.string().min(8, 'New password needs at least 8 characters'),
});

export async function changePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireUser();
  const parsed = pwSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Check the form' };

  const user = await db.query.users.findFirst({ where: eq(schema.users.id, session.id) });
  if (!user || !bcrypt.compareSync(parsed.data.current, user.passwordHash)) {
    return { error: "Current password doesn't match." };
  }
  await db
    .update(schema.users)
    .set({ passwordHash: bcrypt.hashSync(parsed.data.next, 10) })
    .where(eq(schema.users.id, session.id));
  return { ok: true };
}
