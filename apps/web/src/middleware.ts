import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtDecode } from 'jwt-decode';

const PUBLIC_PATHS = ['/login', '/auth/callback', '/auth/error'];
const EXCLUDED_PATHS = ['/_next', '/favicon.ico', '/api'];

export async function middleware(request: NextRequest) {
  const { pathname, search, origin } = request.nextUrl;

  // Skip excluded paths (Next.js internals, API routes)
  if (EXCLUDED_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Allow public paths
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get('access_token')?.value;
  const refreshToken = request.cookies.get('refresh_token')?.value;

  // No tokens → redirect to login with return URL
  if (!accessToken && !refreshToken) {
    const returnUrl = encodeURIComponent(pathname + search);
    return NextResponse.redirect(new URL(`/login?returnUrl=${returnUrl}`, origin));
  }

  // Check if AT is expired or expiring soon (within 2 minutes)
  let needsRefresh = false;
  if (accessToken) {
    try {
      const decoded = jwtDecode<{ exp?: number }>(accessToken);
      const expiresAt = (decoded.exp || 0) * 1000;
      const now = Date.now();
      const twoMinutes = 2 * 60 * 1000;
      needsRefresh = expiresAt - now < twoMinutes;
    } catch {
      needsRefresh = true;
    }
  } else {
    needsRefresh = true;
  }

  // Attempt token refresh if needed
  if (needsRefresh && refreshToken) {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          Cookie: `refresh_token=${refreshToken}`,
        },
      });

      if (response.ok) {
        // Extract cookies from response and set them
        const setCookieHeader = response.headers.get('set-cookie');
        const nextResponse = NextResponse.next();

        if (setCookieHeader) {
          // Parse cookies from Set-Cookie header
          const cookies = setCookieHeader.split(',').map((c) => c.trim());
          for (const cookie of cookies) {
            const [nameValue] = cookie.split(';');
            const [name, value] = nameValue.split('=').map((s) => s.trim());

            if (name === 'access_token' || name === 'refresh_token') {
              const isProd = process.env.NODE_ENV === 'production';
              nextResponse.cookies.set(name, value, {
                httpOnly: true,
                secure: isProd,
                sameSite: isProd ? 'none' : 'lax',
                path: '/',
              });
            }
          }
        }

        return nextResponse;
      } else {
        // Refresh failed → clear cookies and redirect to login
        const returnUrl = encodeURIComponent(pathname + search);
        const redirectResponse = NextResponse.redirect(
          new URL(`/login?returnUrl=${returnUrl}`, origin),
        );
        redirectResponse.cookies.delete('access_token');
        redirectResponse.cookies.delete('refresh_token');
        return redirectResponse;
      }
    } catch (error) {
      console.error('Token refresh failed in middleware:', error);
      // On network error, allow request (AT might still be valid)
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
