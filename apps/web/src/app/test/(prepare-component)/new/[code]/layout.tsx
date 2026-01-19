import { NewMarketTradingProvider } from '@/components/provider/NewMarketTradingProvider';
import { NewOrderbookProvider } from '@/components/provider/NewOrderbookProvider';
import { NewOrderFormProvider } from '@/components/provider/NewOrderFormProvider';
import { NewTradeProvider } from '@/components/provider/NewTradeProvider';

import {
  MarketTradeWithId,
  TradingBalanceDto,
  TradingOrderDto,
} from '@chart/shared-types';
import { MarketOrderbook } from '@chart/shared-types';

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

async function fetchBalances(): Promise<{
  ok: boolean;
  balances: TradingBalanceDto[];
}> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/balances`, {
    cache: 'no-store',
  });

  return res.json();
}

async function fetchOrders(code: string): Promise<{
  ok: boolean;
  orders: TradingOrderDto[];
}> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders?market=${code}`, {
    cache: 'no-store',
  });

  return res.json();
}

export default async function MarketLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ code: string }>;
}>) {
  const { code } = await params;

  const trades = await fetchTrades(code);
  const orderbook = await fetchOrderbook(code);

  const { balances } = await fetchBalances();
  const { orders } = await fetchOrders(code);

  return (
    <NewTradeProvider code={code} initialSnapshot={trades}>
      <NewOrderbookProvider code={code} initialSnapshot={orderbook}>
        <NewMarketTradingProvider balances={balances} orders={orders} code={code}>
          <NewOrderFormProvider>{children}</NewOrderFormProvider>
        </NewMarketTradingProvider>
      </NewOrderbookProvider>
    </NewTradeProvider>
  );
}
