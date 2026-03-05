import { MarketTickerWithNamesMap } from '@chart/shared-types';
import { NewTickerProvider } from '@/components/provider/NewTickerProvider';
import MainPageLayout from '@/components/mainPage/MainPageLayout';
import { getMe } from '@/utils/api/auth.api';
import { getFavorites } from '@/utils/api/favorites.api';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

async function fetchSnapshot(): Promise<MarketTickerWithNamesMap> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tickers/snapshot`, {
    cache: 'no-store',
  });

  return res.json();
}

export default async function HomeContent() {
  const [initialTickers, user] = await Promise.all([fetchSnapshot(), getMe()]);

  if (user && !user.isInitialized) {
    redirect('/initialize');
  }

  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  const favoriteMarkets = user && accessToken ? await getFavorites(accessToken) : [];

  return (
    <NewTickerProvider
      initialSnapshot={initialTickers}
      initialFavorites={favoriteMarkets}
    >
      <MainPageLayout user={user} />
    </NewTickerProvider>
  );
}
