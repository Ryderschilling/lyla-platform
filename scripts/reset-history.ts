/**
 * Wipes MEMBER ACTIVITY — completions, reviews, messages — so streaks, totals
 * and the 12-week grid go back to zero and every number on screen is earned.
 *
 * Leaves accounts, passwords, intake profiles, workouts, referral codes and
 * prices completely alone. Use it after seeding a demo db, or to hand a test
 * account back to a real member with a clean slate.
 *
 *   npm run db:reset-history -- --all
 *   npm run db:reset-history -- --email=brooklyn@progress.club
 *   npm run db:reset-history -- --all --leads      (also clears the leads table)
 *   npm run db:reset-history -- --all --dry-run    (count only, change nothing)
 *
 * Refuses to run with no target on purpose — this is destructive and there is
 * no undo. Once real members are paying, prefer --email over --all.
 */
import './env';
import { neon } from '@neondatabase/serverless';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL missing — put it in .env.local');
const sql = neon(url);

const args = process.argv.slice(2);
const all = args.includes('--all');
const leads = args.includes('--leads');
const dry = args.includes('--dry-run');
const email = args.find((a) => a.startsWith('--email='))?.slice('--email='.length)?.trim().toLowerCase();

function usage(msg: string): never {
  console.error(`\n${msg}\n`);
  console.error('  npm run db:reset-history -- --all');
  console.error('  npm run db:reset-history -- --email=someone@example.com');
  console.error('  optional: --leads (also empty the leads table)  --dry-run (count only)\n');
  process.exit(1);
}

async function main() {
  if (!all && !email) usage('Refusing to run without a target.');
  if (all && email) usage('Pick one: --all or --email=…, not both.');

  const targets = email
    ? await sql`select id, email, full_name from users where lower(email) = ${email}`
    : await sql`select id, email, full_name from users order by role, full_name`;

  if (!targets.length) usage(`No user found for ${email}.`);

  const ids = targets.map((t) => t.id as string);

  const [counts] = await sql`
    select
      (select count(*)::int from completions where user_id = any(${ids})) as completions,
      (select count(*)::int from reviews     where user_id = any(${ids})) as reviews,
      (select count(*)::int from messages    where sender_id = any(${ids}) or recipient_id = any(${ids})) as messages
  `;

  const label = email ? email : `${targets.length} account(s)`;
  console.log(`\ntarget: ${label}`);
  console.log(`  completions ${counts.completions}`);
  console.log(`  reviews     ${counts.reviews}`);
  console.log(`  messages    ${counts.messages}`);
  if (leads) {
    const [l] = await sql`select count(*)::int as n from leads`;
    console.log(`  leads       ${l.n}  (--leads)`);
  }

  if (dry) {
    console.log('\n--dry-run — nothing deleted.\n');
    return;
  }

  // reviews first: they reference movements/workouts, and nothing references them
  await sql`delete from reviews where user_id = any(${ids})`;
  await sql`delete from completions where user_id = any(${ids})`;
  await sql`delete from messages where sender_id = any(${ids}) or recipient_id = any(${ids})`;
  if (leads) await sql`delete from leads`;

  console.log('\nwiped. streaks, totals and the 12-week grid now read 0 until someone actually shows up.\n');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
