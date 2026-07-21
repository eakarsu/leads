import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const publicPaths = [
  '/login',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/api/auth',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/verify-email',
  '/api/lead-operations/opt-out',
  '/api/lead-operations/webhooks',
  '/opt-out',
  '/api/health',
];

const supportedProtectedPaths = [
  '/',
  '/dashboard',
  '/leads',
  '/outreach',
  '/settings',
  '/api/leads',
  '/api/lead-operations',
];

function pathMatches(pathname: string, allowed: string) {
  return pathname === allowed || (allowed !== '/' && pathname.startsWith(`${allowed}/`));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  const isPublic = publicPaths.some((path) => pathMatches(pathname, path));
  if (isPublic || pathname.startsWith('/_next') || pathname.startsWith('/favicon')) {
    const response = NextResponse.next();
    response.headers.set('X-Request-Id', crypto.randomUUID());
    return response;
  }

  if (!supportedProtectedPaths.some((path) => pathMatches(pathname, path))) {
    return new NextResponse('Not found', { status: 404 });
  }

  // Check auth for protected routes
  const token = await getToken({ req: request });
  if ((!token || token.invalid) && !pathname.startsWith('/api/')) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  if ((!token || token.invalid) && pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const unsafeMethod = !['GET', 'HEAD', 'OPTIONS'].includes(request.method);
  if (pathname.startsWith('/api/') && unsafeMethod) {
    const origin = request.headers.get('origin');
    const fetchSite = request.headers.get('sec-fetch-site');
    if ((origin && origin !== request.nextUrl.origin) || fetchSite === 'cross-site') {
      return NextResponse.json({ error: 'Cross-origin request rejected' }, { status: 403 });
    }
  }

  const response = NextResponse.next();
  response.headers.set('X-Request-Id', crypto.randomUUID());
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
