import { MarketTickerWithNamesMap, TradingPositionDto } from '@chart/shared-types';
import { NewTickerProvider } from '@/components/provider/TickerProvider';
import MainPageLayout from '@/components/mainPage/MainPageLayout';
import { getMe } from '@/utils/api/auth.api';
import { getFavorites } from '@/utils/api/favorites.api';
import { cookies } from 'next/headers';

async function fetchSnapshot(): Promise<MarketTickerWithNamesMap> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tickers/snapshot`, {
    cache: 'no-store',
  });

  return res.json();
}

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
  const [initialTickers, user] = await Promise.all([fetchSnapshot(), getMe()]);

  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  const [favoriteMarkets, initialPositions] = await Promise.all([
    user && accessToken ? getFavorites(accessToken) : Promise.resolve([]),
    user && accessToken ? fetchPositions(accessToken) : Promise.resolve([]),
  ]);

  return (
    <NewTickerProvider
      initialSnapshot={initialTickers}
      initialFavorites={favoriteMarkets}
      initialPositions={initialPositions}
    >
      <MainPageLayout user={user} isInitialized={!user || user.isInitialized} />
    </NewTickerProvider>
  );
}
