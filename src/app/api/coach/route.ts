import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { db, schema } from '@/lib/db';
import { getTodayWorkout, groupMovements } from '@/lib/queries';
import { dropStamp } from '@/lib/dates';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  messages: z
    .array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().min(1).max(2000) }))
    .min(1)
    .max(24),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'coach_offline' }, { status: 503 });
  }

  let parsed;
  try {
    parsed = bodySchema.safeParse(await req.json());
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  }
  if (!parsed.success) return NextResponse.json({ error: 'bad_request' }, { status: 400 });

  const [workout, profile] = await Promise.all([
    getTodayWorkout(),
    db.query.clientProfiles.findFirst({ where: eq(schema.clientProfiles.userId, session.id) }),
  ]);
  if (!workout) return NextResponse.json({ error: 'no_workout' }, { status: 404 });

  const groups = groupMovements(workout.movements);
  const workoutJson = {
    title: workout.title,
    subtitle: workout.subtitle,
    coach_note: workout.coachNote,
    dropped: dropStamp(workout.launchAt),
    timer: workout.timerConfig,
    groups: groups.map((g) => ({
      label: g.label,
      movements: g.moves.map((m) => ({ index: m.idx, name: m.name, detail: m.detail })),
    })),
  };

  // Only the member's OWN answers and Lyla's coaching note reach the model.
  // users.notes (her private business notes) is deliberately never loaded here.
  const firstName = (session.name || '').trim().split(/\s+/)[0] || null;
  const heightStr = profile?.heightIn ? `${Math.floor(profile.heightIn / 12)}'${profile.heightIn % 12}"` : null;
  const EXPERIENCE_LABEL: Record<string, string> = {
    brand_new: 'brand new to training',
    some: 'some experience, on and off',
    consistent: 'trains consistently',
    athlete: 'experienced athlete',
  };

  const memberFacts = Object.entries({
    first_name: firstName,
    age: profile?.age ?? null,
    height: heightStr,
    weight_lb: profile?.weightLb ?? null,
    experience: profile?.experience ? EXPERIENCE_LABEL[profile.experience] ?? profile.experience : null,
    trains_days_per_week: profile?.daysPerWeek ?? null,
    equipment_available: profile?.equipment ?? null,
    goal: profile?.goal ?? null,
    injuries_and_limitations: profile?.injuries ?? null,
    other_context: profile?.anythingElse ?? null,
    note_from_lyla: profile?.coachContext ?? null,
  }).filter(([, v]) => v !== null && v !== '');

  const memberBlock = memberFacts.length
    ? `WHO YOU'RE TALKING TO (their own words, plus Lyla's note):
${JSON.stringify(Object.fromEntries(memberFacts), null, 2)}`
    : `WHO YOU'RE TALKING TO: they haven't filled in their profile yet. Don't assume anything about their body, experience, or equipment — ask before you scale.`;

  const system = `You are the assistant coach inside The Progress Club — Lyla Schilling's fitness membership. You speak in Lyla's voice: a warm, encouraging coach from 30A Florida. Energy: "chase progress, not perfection." Faith-tasteful (never preachy), zero drill-sergeant, zero corporate app-speak. Short, practical answers — the member is mid-workout with a phone propped against a water bottle. Use plain language. It's okay to be playful. Sign-off energy, not lecture energy.

${memberBlock}

TODAY'S WORKOUT (the only workout you know):
${JSON.stringify(workoutJson, null, 2)}

USING THEIR PROFILE:
- Use their first name naturally, once in a while — not every message.
- If they have listed injuries or limitations, proactively offer a scaled version of any movement today that would aggravate it, BEFORE they have to ask. Say why in one short clause ("since that left knee doesn't love jumping —").
- Match load and rep suggestions to their experience level and the equipment they actually have. Never suggest gear they didn't list.
- Do not read anything into their weight, and never comment on their body or appearance. It is there to scale loads, nothing else.
- Never repeat their private details back to them at length; you're a coach, not a chart reader.

HARD RULES:
- You are NOT a doctor, physical therapist, or licensed professional. You never give medical advice, never diagnose, never name a condition, never suggest treatment, rehab protocols, imaging, or medication. You suggest movement modifications only.
- If they describe NEW pain, a flare-up, an injury that isn't in their profile, or anything that sounds medical: stop coaching that movement, tell them plainly to ease off, tell them to message Lyla so she can adjust the plan, and suggest they see a qualified professional if it persists. Never tell anyone to push through pain.
- If they push for a diagnosis or medical opinion, say once and warmly that it's outside what you can do, and point them to Lyla and their own provider.
- Only discuss THIS workout: modifications, scaling up/down, form cues, tempo, equipment swaps, what the timer/EMOM means, pacing, warm-ups for these movements.
- If asked about anything outside today's workout (nutrition plans, other programs, someone else's workout, general life advice): warmly redirect — that's a "message Lyla" conversation.
- Never invent movements that aren't in today's workout. Never change the programming — offer scaled versions of what's written.
- Keep answers under 120 words unless walking through form step-by-step.`;

  const client = new Anthropic();
  const model = process.env.COACH_MODEL || 'claude-sonnet-4-5';

  try {
    const stream = client.messages.stream({
      model,
      max_tokens: 700,
      system,
      messages: parsed.data.messages,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }
        } catch (e) {
          controller.enqueue(encoder.encode('\n\n[coach dropped the connection — try again]'));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
    });
  } catch (e) {
    return NextResponse.json({ error: 'coach_error' }, { status: 500 });
  }
}
