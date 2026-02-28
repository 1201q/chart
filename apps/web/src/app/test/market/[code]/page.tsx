import {
  MarketOrderbook,
  MarketTickerWithNamesMap,
  MarketTradeWithId,
  TradingBalanceDto,
  TradingFillDto,
  TradingOrderDto,
} from '@chart/shared-types';
import { cookies } from 'next/headers';
import { NewTickerProvider } from '@/components/provider/NewTickerProvider';
import { NewTradeProvider } from '@/components/provider/NewTradeProvider';
import { NewOrderbookProvider } from '@/components/provider/NewOrderbookProvider';
import { NewOrderFormProvider } from '@/components/provider/NewOrderFormProvider';
import { NewMarketTradingProvider } from '@/components/provider/NewMarketTradingProvider';
import NewOrderFormInit from '@/components/provider/NewOrderFormInit';
import { QueryProvider } from '@/components/provider/QueryProvider';
import TestMarketPageClient from '@/components/testMarket/TestMarketPageClient';
import { getMe } from '@/utils/api/auth.api';
import { getFavorites } from '@/utils/api/favorites.api';

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

async function fetchBalances(accessToken: string): Promise<TradingBalanceDto[]> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/balances`, {
      cache: 'no-store',
      headers: { Cookie: `access_token=${accessToken}` },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.balances ?? [];
  } catch {
    return [];
  }
}

async function fetchOrders(
  code: string,
  accessToken: string,
): Promise<(TradingOrderDto & { fills: TradingFillDto[] })[]> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders?market=${code}`, {
      cache: 'no-store',
      headers: { Cookie: `access_token=${accessToken}` },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.orders ?? [];
  } catch {
    return [];
  }
}

export default async function TestMarketPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;

  const [initialTickers, initialTrades, initialOrderbook, user] = await Promise.all([
    fetchSnapshot(),
    fetchTrades(code),
    fetchOrderbook(code),
    getMe(),
  ]);

  const [balances, orders, favoriteMarkets] =
    user && accessToken
      ? await Promise.all([
          fetchBalances(accessToken),
          fetchOrders(code, accessToken),
          getFavorites(accessToken),
        ])
      : [[], [], []];

  return (
    <QueryProvider>
      <NewTickerProvider
        initialSnapshot={initialTickers}
        initialFavorites={favoriteMarkets}
      >
        <NewTradeProvider code={code} initialSnapshot={initialTrades}>
          <NewOrderbookProvider code={code} initialSnapshot={initialOrderbook}>
            <NewMarketTradingProvider
              code={code}
              balances={balances}
              orders={orders}
              authenticated={!!user}
            >
              <NewOrderFormProvider>
                <NewOrderFormInit code={code} />
                <TestMarketPageClient
                  user={user}
                  code={code}
                  initialIsFavorite={favoriteMarkets.includes(code)}
                />
              </NewOrderFormProvider>
            </NewMarketTradingProvider>
          </NewOrderbookProvider>
        </NewTradeProvider>
      </NewTickerProvider>
    </QueryProvider>
  );
}
