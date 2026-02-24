import { MarketTickerWithNamesMap, MarketTradeWithId } from '@chart/shared-types';
import { NewTickerProvider } from '@/components/provider/NewTickerProvider';
import { NewTradeProvider } from '@/components/provider/NewTradeProvider';
import { QueryProvider } from '@/components/provider/QueryProvider';
import TestMarketPageClient from '@/components/testMarket/TestMarketPageClient';
import { getMe } from '@/utils/api/auth.api';

async function fetchSnapshot(): Promise<MarketTickerWithNamesMap> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tickers/snapshot`, {
    cache: 'no-store',
  });
  return res.json();
}

async function fetchTrades(code: string): Promise<MarketTradeWithId[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/trades/${code}`, {
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
  const [initialTickers, initialTrades, user] = await Promise.all([
    fetchSnapshot(),
    fetchTrades(code),
    getMe(),
  ]);

  return (
    <QueryProvider>
      <NewTickerProvider initialSnapshot={initialTickers}>
        <NewTradeProvider code={code} initialSnapshot={initialTrades}>
          <TestMarketPageClient user={user} code={code} />
        </NewTradeProvider>
      </NewTickerProvider>
    </QueryProvider>
  );
}
