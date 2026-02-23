import { MarketTickerWithNamesMap } from '@chart/shared-types';
import { NewTickerProvider } from '@/components/provider/NewTickerProvider';
import { QueryProvider } from '@/components/provider/QueryProvider';
import TestMarketPageClient from '@/components/testMarket/TestMarketPageClient';
import { getMe } from '@/utils/api/auth.api';

async function fetchSnapshot(): Promise<MarketTickerWithNamesMap> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tickers/snapshot`, {
    cache: 'no-store',
  });
  return res.json();
}

export default async function TestMarketPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const [initialTickers, user] = await Promise.all([fetchSnapshot(), getMe()]);

  return (
    <QueryProvider>
      <NewTickerProvider initialSnapshot={initialTickers}>
        <TestMarketPageClient user={user} code={code} />
      </NewTickerProvider>
    </QueryProvider>
  );
}
