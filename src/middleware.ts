import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SESSION_COOKIE = 'pc_session';

async function readSession(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token || !process.env.AUTH_SECRET) return null;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.AUTH_SECRET));
    return payload as { sub?: string; role?: string };
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const session = await readSession(req);

  if (pathname === '/login') {
    if (session?.sub) {
      return NextResponse.redirect(new URL(session.role === 'admin' ? '/hq' : '/club', req.url));
    }
    return NextResponse.next();
  }

  if (!session?.sub) {
    const login = new URL('/login', req.url);
    login.searchParams.set('next', pathname);
    return NextResponse.redirect(login);
  }

  if (pathname.startsWith('/hq') && session.role !== 'admin') {
    return NextResponse.redirect(new URL('/club', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/club/:path*', '/hq/:path*', '/welcome', '/login'],
};
