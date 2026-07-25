/**
 * The Club page's read-only demo of the training room.
 * Mirrors the seeded "Glute + Hamstring Builder" — hardcoded so the public
 * demo always works and never needs database access.
 */
export const DEMO_WORKOUT = {
  title: 'Glute + Hamstring Builder',
  subtitle: 'Lower body · 40 minutes',
  coachNote: "Slow on the way down — that's where you get strong.",
  timer: { emom: { rounds: 5, interval_sec: 60, label: '12 SWINGS' } },
  groups: [
    {
      label: 'SUPERSET A — REST 1:00',
      moves: [
        { idx: 'A1', name: 'Romanian Deadlift', detail: '4×8 · :03 LOWERING' },
        { idx: 'A2', name: 'Banded Glute Abduction', detail: '4×20 · :02 HOLD AT TOP' },
      ],
    },
    {
      label: 'SUPERSET B — REST 1:00',
      moves: [
        { idx: 'B1', name: 'Bulgarian Split Squat', detail: '3×10/LEG · WEIGHT IN HEEL' },
        { idx: 'B2', name: 'Single-Leg RDL', detail: '3×10/LEG' },
      ],
    },
    {
      label: 'FINISHER',
      moves: [{ idx: 'C', name: 'Kettlebell Swings', detail: 'EMOM ×5 · 12 SWINGS' }],
    },
  ],
};

const REPLIES: Array<{ match: RegExp; reply: string }> = [
  {
    match: /(easi|scale|modif|beginner|too hard|lighter|regress)/i,
    reply:
      "Totally fine to scale — take the RDLs lighter and cut to 3 sets, and swap Bulgarian split squats for reverse lunges if the balance feels wobbly today. Same movement pattern, same benefit. Progress, not perfection.",
  },
  {
    match: /(form|how do i|technique|hurt my (back|knees)|lower back)/i,
    reply:
      "For the RDL: soft knees, hips push BACK like you're closing a car door, bar or bells slide down your thighs, flat back the whole way. If your lower back is talking, lighten up and shorten the range — hinge to mid-shin, not the floor.",
  },
  {
    match: /(no (band|kettlebell|kb|weight)|don'?t have|equipment|swap|instead)/i,
    reply:
      "No kettlebell? A dumbbell held goblet-style works for every swing and squat today. No band? Do the abductions lying on your side — slow, with a :02 squeeze at the top. Use what you've got.",
  },
  {
    match: /(pain|injur|sharp|pinch|hurts)/i,
    reply:
      "If anything feels like PAIN (sharp, pinching, wrong) — stop that movement, ease off, and message Lyla so she can adjust your plan. Never push through pain. Soreness is fine; pain is information.",
  },
  {
    match: /(emom|timer|finisher|swings?)/i,
    reply:
      "The finisher is a 5-minute EMOM: every minute on the minute, do 12 swings, then rest whatever's left of that minute. Hips snap, arms just hold on. The timer on the right runs it for you — hit EMOM mode and START.",
  },
];

export const DEMO_GREETING =
  "Hey! I'm Lyla's assistant coach — I know today's workout inside out. Ask me about scaling, form, or equipment swaps. (This is the demo brain — members get the real one.)";

export function demoCoachReply(input: string): string {
  for (const r of REPLIES) if (r.match.test(input)) return r.reply;
  return "Good question! In the Club I know every movement in today's WOD — sets, tempo, Lyla's cues — and answer like her assistant coach. This preview only knows the basics: try asking how to scale it, fix your RDL form, or what to do with no equipment.";
}
