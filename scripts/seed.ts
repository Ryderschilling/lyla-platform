/**
 * Seeds the SHELL of the platform: Lyla (admin), two test clients, three
 * launched workouts, one scheduled future workout, referral codes.
 * Idempotent-ish: skips entirely if Lyla already exists.
 *   npm run db:seed
 *
 * DELIBERATELY SEEDS NO MEMBER ACTIVITY. No completions, no reviews, no
 * messages, no leads. Streaks, "TOTAL WORKOUTS", the 12-week grid, the HQ
 * fading-client flag and the MRR bar are all derived from those tables, so
 * inventing rows here makes a brand-new account read as a 3-day streak that
 * nobody earned. Every number in the product has to be real.
 * Need to clear activity from a db that was seeded before this rule:
 *   npm run db:reset-history -- --all
 */
import './env';
import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL missing — put it in .env.local');
const sql = neon(url);

// Fixed ids so relations are readable
const LYLA = 'a0000000-0000-4000-8000-000000000001';
const BROOKLYN = 'a0000000-0000-4000-8000-000000000002';
const EZRA = 'a0000000-0000-4000-8000-000000000003';
const W1 = 'b0000000-0000-4000-8000-000000000001'; // today — Glute + Hamstring Builder
const W2 = 'b0000000-0000-4000-8000-000000000002'; // yesterday — Sunrise Burner
const W3 = 'b0000000-0000-4000-8000-000000000003'; // two days ago — Core + Carry
const W4 = 'b0000000-0000-4000-8000-000000000004'; // tomorrow (must NOT leak to members)

// 5:00 AM America/Chicago (CDT, UTC-5) for a given date
const drop = (d: string) => `${d}T10:00:00Z`;
const today = new Date();
const day = (offset: number) => {
  const d = new Date(today.getTime() + offset * 86400000);
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago' }).format(d);
};

async function main() {
  const existing = await sql`select id from users where id = ${LYLA}`;
  if (existing.length) { console.log('seed already present — nothing to do'); return; }

  // Real credentials never live in a git-tracked file. Override via env for a
  // fresh install, or leave the placeholder and set the real login afterwards
  // with `npm run db:set-admin`.
  const adminEmail = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase() || 'lyla@lylaschilling.com';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'sunrise-2026';
  const adminHash = bcrypt.hashSync(adminPassword, 10);
  const clientHash = bcrypt.hashSync('progress-2026', 10);

  await sql`insert into users (id, email, password_hash, full_name, role) values
    (${LYLA}, ${adminEmail}, ${adminHash}, 'Lyla Schilling', 'admin'),
    (${BROOKLYN}, 'brooklyn@progress.club', ${clientHash}, 'Brooklyn R.', 'client'),
    (${EZRA}, 'ezra@progress.club', ${clientHash}, 'Ezra S.', 'client')`;

  await sql`insert into workouts (id, title, subtitle, coach_note, launch_at, timer_config) values
    (${W1}, 'Glute + Hamstring Builder', 'Lower body · 40 minutes',
      'Slow on the way down — that''s where you get strong. Grab a moderate kettlebell and a band.',
      ${drop(day(0))}, ${'{"emom":{"rounds":5,"interval_sec":60,"label":"12 SWINGS"}}'}::jsonb),
    (${W2}, 'Sunrise Burner', 'Full body · 30 minutes',
      'Move quick, breathe slower than you want to. One kettlebell, no excuses.',
      ${drop(day(-1))}, ${'{"emom":{"rounds":5,"interval_sec":60,"label":"10 SWINGS"}}'}::jsonb),
    (${W3}, 'Core + Carry', 'Core · 25 minutes',
      'Brace like someone''s about to poke you. Heavy carries, quiet core.',
      ${drop(day(-2))}, ${'{}'}::jsonb),
    (${W4}, 'Full Body Reset', 'Full body · 35 minutes',
      'Easy pace on purpose. We build tomorrow off today''s recovery.',
      ${drop(day(1))}, ${'{"emom":{"rounds":4,"interval_sec":90,"label":"CARRY + SQUAT"}}'}::jsonb)`;

  await sql`insert into movements (workout_id, group_label, seq, name, detail) values
    (${W1}, 'SUPERSET A — REST 1:00', 1, 'Romanian Deadlift', '4×8 · :03 LOWERING'),
    (${W1}, 'SUPERSET A — REST 1:00', 2, 'Banded Glute Abduction', '4×20 · :02 HOLD AT TOP'),
    (${W1}, 'SUPERSET B — REST 1:00', 3, 'Bulgarian Split Squat', '3×10/LEG · WEIGHT IN HEEL'),
    (${W1}, 'SUPERSET B — REST 1:00', 4, 'Single-Leg RDL', '3×10/LEG'),
    (${W1}, 'FINISHER', 5, 'Kettlebell Swings', 'EMOM ×5 · 12 SWINGS'),
    (${W2}, 'SUPERSET A — REST :45', 1, 'Goblet Squat', '4×10 · HEELS DOWN'),
    (${W2}, 'SUPERSET A — REST :45', 2, 'Push-Up', '3×10 · INCLINE OK'),
    (${W2}, 'SUPERSET B — REST :45', 3, 'Walking Lunge', '3×12/LEG'),
    (${W2}, 'FINISHER', 4, 'Kettlebell Swings', 'EMOM ×5 · 10 SWINGS'),
    (${W3}, 'CIRCUIT — 3 ROUNDS', 1, 'Farmer Carry', '40 YDS · HEAVY'),
    (${W3}, 'CIRCUIT — 3 ROUNDS', 2, 'Plank Shoulder Tap', '20 TOTAL · HIPS QUIET'),
    (${W3}, 'CIRCUIT — 3 ROUNDS', 3, 'Dead Bug', '10/SIDE · SLOW'),
    (${W3}, 'CIRCUIT — 3 ROUNDS', 4, 'Hollow Hold', ':30 · BREATHE'),
    (${W4}, 'FLOW — 4 ROUNDS', 1, 'Air Squat', '15 · SMOOTH'),
    (${W4}, 'FLOW — 4 ROUNDS', 2, 'Push Press', '10 · LIGHT'),
    (${W4}, 'FLOW — 4 ROUNDS', 3, 'Suitcase Carry', '30 YDS/SIDE')`;

  await sql`insert into referral_codes (brand, code, url, blurb, sort) values
    ('Legion Athletics', 'LYLA20', 'https://legionathletics.com', 'My protein + pre. Clean label, actually tastes good.', 1),
    ('Bala', 'LYLA10', 'https://shopbala.com', 'The cute weights all over my reels.', 2),
    ('Thrive Market', 'LYLA30', 'https://thrivemarket.com', 'Where the protein-cookie ingredients come from.', 3),
    ('Vuori', 'LYLA15', 'https://vuoriclothing.com', 'Live in the joggers. That''s the whole review.', 4)`;

  console.log('seeded: 3 users, 4 workouts, 16 movements, 4 referral codes — ZERO member activity, by design');
  console.log(`ADMIN — ${adminEmail}${process.env.SEED_ADMIN_PASSWORD ? ' (password from SEED_ADMIN_PASSWORD)' : ' / sunrise-2026 — CHANGE IT: npm run db:set-admin'}`);
  console.log('CLIENTS — brooklyn@progress.club + ezra@progress.club / progress-2026');
}
main().catch((e) => { console.error(e); process.exit(1); });
