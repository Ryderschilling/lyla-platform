import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db, schema } from './db';

export const SESSION_COOKIE = 'pc_session';
const secret = () => {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error('AUTH_SECRET is not set');
  return new TextEncoder().encode(s);
};

export type Session = { id: string; role: 'admin' | 'client'; name: string; email: string };

export async function createSessionToken(user: Session): Promise<string> {
  return new SignJWT({ role: user.role, name: user.name, email: user.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secret());
}

export async function verifySessionToken(token: string): Promise<Session | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.sub) return null;
    return {
      id: payload.sub,
      role: payload.role as 'admin' | 'client',
      name: (payload.name as string) ?? '',
      email: (payload.email as string) ?? '',
    };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<Session | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/** Session + fresh DB row (catches deactivated accounts). Redirects to /login when invalid. */
export async function requireUser(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect('/login');
  const [row] = await db.select({ active: schema.users.active }).from(schema.users).where(eq(schema.users.id, session.id));
  if (!row || !row.active) redirect('/login?deactivated=1');
  return session;
}

export async function requireAdmin(): Promise<Session> {
  const session = await requireUser();
  if (session.role !== 'admin') redirect('/club');
  return session;
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  };
}
