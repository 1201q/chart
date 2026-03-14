import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const EXCLUDED_PATHS = ['/_next', '/favicon.ico', '/api'];

export async function proxy(request: NextRequest) {
  const { pathname, origin } = request.nextUrl;

  // Skip excluded paths (Next.js internals, API routes)
  if (EXCLUDED_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get('access_token')?.value;
  const refreshToken = request.cookies.get('refresh_token')?.value;

  if (pathname === '/login') {
    // AT가 유효하면 이미 인증된 상태 -> market으로
    if (accessToken) {
      return NextResponse.redirect(new URL('/market/KRW-BTC', origin));
    }

    // AT는 없고 RT만 있는 경우: silent refresh를 시도한다.
    // - refresh 성공 -> 새 AT/RT 쿠키를 전달하며 /market 리다이렉트 (세션 유효)
    // - refresh 실패 -> 로그인 페이지 표시 (stale RT는 client.ts가 logout 호출로 정리)
    if (refreshToken) {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (apiUrl) {
        try {
          const refreshRes = await fetch(`${apiUrl}/auth/refresh`, {
            method: 'POST',
            headers: { Cookie: `refresh_token=${refreshToken}` },
          });

          if (refreshRes.ok) {
            // RT Rotation으로 새 AT/RT가 발급됐으므로 Set-Cookie를 반드시 전달해야 한다.
            const redirectRes = NextResponse.redirect(
              new URL('/market/KRW-BTC', origin),
            );
            for (const cookie of refreshRes.headers.getSetCookie()) {
              redirectRes.headers.append('set-cookie', cookie);
            }
            return redirectRes;
          }
          // refresh 실패 -> 로그인 페이지로 (stale RT는 이후 client.ts logout 호출로 정리됨)
        } catch {
          // 네트워크 오류 -> 로그인 페이지로
        }
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
