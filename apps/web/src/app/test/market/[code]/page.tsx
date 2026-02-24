import {
  MarketOrderbook,
  MarketTickerWithNamesMap,
  MarketTradeWithId,
} from '@chart/shared-types';
import { NewTickerProvider } from '@/components/provider/NewTickerProvider';
import { NewTradeProvider } from '@/components/provider/NewTradeProvider';
import { NewOrderbookProvider } from '@/components/provider/NewOrderbookProvider';
import { NewOrderFormProvider } from '@/components/provider/NewOrderFormProvider';
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

async function fetchOrderbook(code: string): Promise<MarketOrderbook> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orderbook/${code}`, {
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
  const [initialTickers, initialTrades, initialOrderbook, user] = await Promise.all([
    fetchSnapshot(),
    fetchTrades(code),
    fetchOrderbook(code),
    getMe(),
  ]);

  return (
    <QueryProvider>
      <NewTickerProvider initialSnapshot={initialTickers}>
        <NewTradeProvider code={code} initialSnapshot={initialTrades}>
          <NewOrderbookProvider code={code} initialSnapshot={initialOrderbook}>
            <NewOrderFormProvider>
              <TestMarketPageClient user={user} code={code} />
            </NewOrderFormProvider>
          </NewOrderbookProvider>
        </NewTradeProvider>
      </NewTickerProvider>
    </QueryProvider>
  );
}
