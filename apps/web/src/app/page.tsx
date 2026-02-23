import { MarketTickerWithNamesMap } from '@chart/shared-types';
import { NewTickerProvider } from '@/components/provider/NewTickerProvider';
import MainPageLayout from '@/components/mainPage/MainPageLayout';
import { getMe } from '@/utils/api/auth.api';

async function fetchSnapshot(): Promise<MarketTickerWithNamesMap> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tickers/snapshot`, {
    cache: 'no-store',
  });

  return res.json();
}

export default async function HomePage() {
  const [initialTickers, user] = await Promise.all([fetchSnapshot(), getMe()]);

  return (
    <NewTickerProvider initialSnapshot={initialTickers}>
      <MainPageLayout user={user} />
    </NewTickerProvider>
  );
}
