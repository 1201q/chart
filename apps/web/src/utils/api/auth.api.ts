import { cookies } from 'next/headers';

export interface AuthUser {
  id: string;
  email: string;
  nickname: string | null;
  profileImageUrl: string | null;
  role: 'ADMIN' | 'USER';
  provider: 'GOOGLE' | 'NAVER';
  isInitialized: boolean;
  lastLoginAt: string | null;
}

export async function getMe(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;

  if (!accessToken) return null;

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
      headers: {
        Cookie: `access_token=${accessToken}`,
      },
      cache: 'no-store',
    });

    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}
