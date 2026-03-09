import { FavoritesResponse, ToggleFavoriteResponse } from '@chart/shared-types';

// 서버사이드: 즐겨찾기 목록 조회
export async function getFavorites(accessToken: string): Promise<string[]> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL?.replace('/mock', '')}/favorites`,
      {
        cache: 'no-store',
        headers: { Cookie: `access_token=${accessToken}` },
      },
    );
    if (!res.ok) return [];
    const json: FavoritesResponse = await res.json();
    return json.markets;
  } catch {
    return [];
  }
}

// 클라이언트사이드: 즐겨찾기 토글
export async function toggleFavorite(market: string): Promise<ToggleFavoriteResponse> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL?.replace('/mock', '')}/favorites/${market}`,
    {
      method: 'POST',
      credentials: 'include',
    },
  );

  if (!res.ok) {
    throw new Error('Failed to toggle favorite');
  }

  return res.json();
}
