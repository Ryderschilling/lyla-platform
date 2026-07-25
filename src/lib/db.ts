import { neon } from '@neondatabase/serverless';
import { drizzle, type NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from './schema';

/**
 * Connect on first use, not on import. `next build` imports every route module
 * to collect page data, so throwing at import time fails the build on any host
 * that has no DATABASE_URL yet — the error surfaces as a build failure rather
 * than the missing-config problem it actually is.
 */
let instance: NeonHttpDatabase<typeof schema> | null = null;

function client(): NeonHttpDatabase<typeof schema> {
  if (instance) return instance;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set — copy .env.example to .env.local and fill it in.');
  instance = drizzle(neon(url), { schema });
  return instance;
}

export const db = new Proxy({} as NeonHttpDatabase<typeof schema>, {
  get(_target, prop) {
    const real = client() as unknown as Record<string | symbol, unknown>;
    const value = real[prop];
    return typeof value === 'function' ? value.bind(real) : value;
  },
});

export { schema };
