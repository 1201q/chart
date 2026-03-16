import { TradingPositionDto } from '@chart/shared-types';
import { TickerContextHydrator } from '@/components/provider/TickerContextHydrator';
import MainPageLayout from '@/components/mainPage/MainPageLayout';
import { getMe } from '@/utils/api/auth.api';
import { getFavorites } from '@/utils/api/favorites.api';
import { cookies } from 'next/headers';

async function fetchPositions(accessToken: string): Promise<TradingPositionDto[]> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/positions`, {
      cache: 'no-store',
      headers: { Cookie: `access_token=${accessToken}` },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.positions ?? [];
  } catch {
    return [];
  }
}

export default async function HomeContent() {
  const user = await getMe();

  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  const [favoriteMarkets, initialPositions] = await Promise.all([
    user && accessToken ? getFavorites(accessToken) : Promise.resolve([]),
    user && accessToken ? fetchPositions(accessToken) : Promise.resolve([]),
  ]);

  return (
    <>
      <TickerContextHydrator favorites={favoriteMarkets} positions={initialPositions} />
      <MainPageLayout user={user} isInitialized={!user || user.isInitialized} />
    </>
  );
}
