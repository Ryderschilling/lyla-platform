/**
 * Loads .env.local (then .env) into process.env for the CLI scripts.
 *
 * Next.js does this automatically for the app, but `tsx scripts/*.ts` runs
 * outside Next — without this every db script dies on "DATABASE_URL missing"
 * unless you prefix the var by hand. Import it FIRST in any script that reads
 * process.env:  import './env';
 *
 * Deliberately dependency-free (no dotenv) and non-destructive: a variable
 * already present in the real environment always wins, so CI and Vercel
 * secrets are never overwritten by a stale local file.
 */
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

function load(file: string): void {
  const path = join(process.cwd(), file);
  if (!existsSync(path)) return;
  for (const raw of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 1) continue;
    const key = line.slice(0, eq).trim().replace(/^export\s+/, '');
    if (process.env[key] !== undefined) continue; // real env wins
    let value = line.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

load('.env.local');
load('.env');
