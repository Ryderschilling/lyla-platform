/**
 * Applies every SQL file in /drizzle in order, once each.
 * Records applied files in _migrations. Safe to re-run.
 *   npm run db:migrate
 */
import './env';
import { neon } from '@neondatabase/serverless';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL missing — put it in .env.local');
const sql = neon(url);

async function main() {
  await sql`create table if not exists _migrations (name text primary key, applied_at timestamptz not null default now())`;
  const applied = new Set((await sql`select name from _migrations`).map((r: any) => r.name));
  const files = readdirSync(join(process.cwd(), 'drizzle')).filter((f) => f.endsWith('.sql')).sort();
  for (const f of files) {
    if (applied.has(f)) { console.log('skip', f); continue; }
    const text = readFileSync(join(process.cwd(), 'drizzle', f), 'utf8');
    // split on semicolons at end-of-statement (no functions/procedures in our migrations)
    const stmts = text.split(/;\s*(?:\n|$)/).map((s) => s.trim()).filter(Boolean);
    for (const s of stmts) await sql.query(s);
    await sql`insert into _migrations (name) values (${f})`;
    console.log('applied', f);
  }
  console.log('migrations up to date');
}
main().catch((e) => { console.error(e); process.exit(1); });
