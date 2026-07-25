'use server';

import { z } from 'zod';
import { db, schema } from '../db';
import { getAdmin } from '../queries';

export type FormState = { error?: string; ok?: boolean };

const leadSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a real email and the workouts are yours'),
  source: z.string().max(40).optional(),
  company: z.string().max(0).optional(), // honeypot
});

export async function subscribeLead(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = leadSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Check that email' };
  if (formData.get('company')) return { ok: true }; // bots think they won
  await db
    .insert(schema.leads)
    .values({ email: parsed.data.email, source: parsed.data.source ?? 'site' })
    .onConflictDoNothing();
  return { ok: true };
}

const contactSchema = z.object({
  name: z.string().trim().min(2, "What's your name?").max(80),
  email: z.string().trim().toLowerCase().email('Need a real email to write you back'),
  message: z.string().trim().min(5, 'Say a little more').max(4000),
  company: z.string().max(0).optional(), // honeypot
});

export async function sendContactMessage(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = contactSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Check the form' };
  if (formData.get('company')) return { ok: true };

  const admin = await getAdmin();
  if (!admin) return { error: "Something's off on our end — email Lyla directly instead." };

  await db.insert(schema.messages).values({
    senderId: null,
    recipientId: admin.id,
    guestName: parsed.data.name,
    guestEmail: parsed.data.email,
    body: parsed.data.message,
  });
  return { ok: true };
}
