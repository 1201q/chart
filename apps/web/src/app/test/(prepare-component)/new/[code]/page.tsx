import NewMarketPageClient from '@/components/NewMarketPageClient';
import OrderForm from '@/components/order/new/NewOrderForm';
import { NewMarketTradingProvider } from '@/components/provider/NewMarketTradingProvider';
import { Tab } from '@/types/tabs.types';
import { TradingBalanceDto, TradingOrderDto } from '@chart/shared-types';
import { Suspense } from 'react';

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

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { code } = await params;
  const { tab } = await searchParams;

  const initialTab = (tab as Tab) ?? 'chart';

  const { balances } = await fetchBalances();
  const { orders } = await fetchOrders(code);

  return (
    <NewMarketPageClient code={code} initialTab={initialTab}>
      <Suspense fallback={<div>Loading Order Form...</div>}>
        <NewMarketTradingProvider balances={balances} orders={orders} code={code}>
          <OrderForm code={code} />
        </NewMarketTradingProvider>
      </Suspense>
    </NewMarketPageClient>
  );
}
