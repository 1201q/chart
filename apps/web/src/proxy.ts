import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const EXCLUDED_PATHS = ['/_next', '/favicon.ico', '/api'];

export async function proxy(request: NextRequest) {
  const { pathname, search, origin } = request.nextUrl;

  // Skip excluded paths (Next.js internals, API routes)
  if (EXCLUDED_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get('access_token')?.value;
  const refreshToken = request.cookies.get('refresh_token')?.value;

  // Redirect logged-in users away from login page
  if (pathname === '/login' && (accessToken || refreshToken)) {
    return NextResponse.redirect(new URL('/market/KRW-BTC', origin));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
