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

function ms(start: bigint) {
  return Number(process.hrtime.bigint() - start) / 1e6;
}

async function timed<T>(label: string, fn: () => Promise<T>): Promise<T> {
  const t0 = process.hrtime.bigint();
  const r = await fn();
  console.log(`[market-layout] ${label} ${ms(t0).toFixed(1)}ms`);
  return r;
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

// export default async function MarketLayout({
//   children,
//   params,
// }: Readonly<{
//   children: React.ReactNode;
//   params: Promise<{ code: string }>;
// }>) {
//   const { code } = await params;

//   const t0 = process.hrtime.bigint();

//   const [trades, orderbook, balancesRes, ordersRes] = await Promise.all([
//     timed('trades', () => fetchTrades(code)),
//     timed('orderbook', () => fetchOrderbook(code)),
//     timed('balances', () => fetchBalances()),
//     timed('orders', () => fetchOrders(code)),
//   ]);

//   console.log(`[market-layout] total(parallel) ${ms(t0).toFixed(1)}ms`);

//   return (
//     <NewTradeProvider code={code} initialSnapshot={trades}>
//       <NewOrderbookProvider code={code} initialSnapshot={orderbook}>
//         <NewMarketTradingProvider
//           balances={balancesRes.balances}
//           orders={ordersRes.orders}
//           code={code}
//         >
//           <NewOrderFormProvider>{children}</NewOrderFormProvider>
//         </NewMarketTradingProvider>
//       </NewOrderbookProvider>
//     </NewTradeProvider>
//   );
// }

export default async function MarketLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ code: string }>;
}>) {
  const { code } = await params;

  const t0 = process.hrtime.bigint();

  const trades = await timed('trades', () => fetchTrades(code));
  const orderbook = await timed('orderbook', () => fetchOrderbook(code));
  const balancesRes = await timed('balances', () => fetchBalances());
  const ordersRes = await timed('orders', () => fetchOrders(code));

  console.log(`[market-layout] total(serial) ${ms(t0).toFixed(1)}ms`);

  return (
    <NewTradeProvider code={code} initialSnapshot={trades}>
      <NewOrderbookProvider code={code} initialSnapshot={orderbook}>
        <NewMarketTradingProvider
          balances={balancesRes.balances}
          orders={ordersRes.orders}
          code={code}
        >
          <NewOrderFormProvider>{children}</NewOrderFormProvider>
        </NewMarketTradingProvider>
      </NewOrderbookProvider>
    </NewTradeProvider>
  );
}
