import { MarketTickerWithNamesMap } from '@chart/shared-types';
import { NewTickerProvider } from '@/components/provider/NewTickerProvider';
import MainPageLayout from '@/components/mainPage/MainPageLayout';

async function fetchSnapshot(): Promise<MarketTickerWithNamesMap> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tickers/snapshot`, {
    cache: 'no-store',
  });

  return res.json();
}

export default async function HomePage() {
  const initialTickers = await fetchSnapshot();

  return (
    <NewTickerProvider initialSnapshot={initialTickers}>
      <MainPageLayout />
    </NewTickerProvider>
  );
}
