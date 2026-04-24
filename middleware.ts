import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const publicPaths = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/api/auth',
  '/api/register',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/verify-email',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  const isPublic = publicPaths.some((p) => pathname.startsWith(p));
  if (isPublic || pathname.startsWith('/_next') || pathname.startsWith('/favicon')) {
    const response = NextResponse.next();
    response.headers.set('X-Request-Id', crypto.randomUUID());
    return response;
  }

  // Check auth for protected routes
  const token = await getToken({ req: request });
  if (!token && !pathname.startsWith('/api/')) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (!token && pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const response = NextResponse.next();
  response.headers.set('X-Request-Id', crypto.randomUUID());
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
