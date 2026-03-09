import {
  MarketOrderbook,
  MarketTickerWithNamesMap,
  MarketTradeWithId,
  TradingBalanceDto,
  TradingFillDto,
  TradingOrderDto,
} from '@chart/shared-types';
import { cookies } from 'next/headers';
import { NewTickerProvider } from '@/components/provider/TickerProvider';
import { NewTradeProvider } from '@/components/provider/TradeProvider';
import { NewOrderbookProvider } from '@/components/provider/OrderbookProvider';
import { NewOrderFormProvider } from '@/components/provider/OrderFormProvider';
import { NewMarketTradingProvider } from '@/components/provider/MarketTradingProvider';
import NewOrderFormInit from '@/components/provider/OrderFormInit';
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

export default async function MarketContent({ code }: { code: string }) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;

  // 낙관적 auth fetch: 토큰이 있으면 getMe() 완료 전에 미리 시작
  // fetchBalances/fetchOrders/getFavorites는 실패 시 [] 반환하므로 안전
  const balancesP = accessToken ? fetchBalances(accessToken) : Promise.resolve([]);
  const ordersP = accessToken ? fetchOrders(code, accessToken) : Promise.resolve([]);
  const favoritesP = accessToken ? getFavorites(accessToken) : Promise.resolve([]);

  const [initialTickers, initialTrades, initialOrderbook, user] = await Promise.all([
    fetchSnapshot(),
    fetchTrades(code),
    fetchOrderbook(code),
    getMe(),
  ]);

  const [balances, orders, favoriteMarkets] = user
    ? await Promise.all([balancesP, ordersP, favoritesP])
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
