import { neon } from '@neondatabase/serverless';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
const env = Object.fromEntries(readFileSync('.env.local','utf8').split('\n').filter(l=>l.includes('=')&&!l.trim().startsWith('#')).map(l=>{const i=l.indexOf('=');return [l.slice(0,i).trim(), l.slice(i+1).trim().replace(/^["']|["']$/g,'')];}));
const sql = neon(env.DATABASE_URL);
await sql`create table if not exists _migrations (name text primary key, applied_at timestamptz not null default now())`;
const applied = new Set((await sql`select name from _migrations`).map(r=>r.name));
for (const f of readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort()) {
  if (applied.has(f)) { console.log('skip', f); continue; }
  const text = readFileSync(join('drizzle', f), 'utf8');
  for (const s of text.split(/;\s*(?:\n|$)/).map(s=>s.trim()).filter(Boolean)) await sql.query(s);
  await sql`insert into _migrations (name) values (${f})`;
  console.log('applied', f);
}
const cols = await sql`select column_name, data_type from information_schema.columns where table_name='users' order by ordinal_position`;
console.log(cols.map(c=>c.column_name+':'+c.data_type).join('\n'));
