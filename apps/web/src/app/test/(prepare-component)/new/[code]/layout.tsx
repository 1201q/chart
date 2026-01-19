import SkeletonHeader from '@/components/header/SkeletonHeader';
import { NewOrderbookProvider } from '@/components/provider/NewOrderbookProvider';
import { NewTradeProvider } from '@/components/provider/NewTradeProvider';

import { MarketTradeWithId } from '@chart/shared-types';
import { MarketOrderbook } from '@chart/shared-types';
import { Suspense } from 'react';

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

  return (
    <Suspense fallback={<SkeletonHeader />}>
      <NewTradeProvider code={code} initialSnapshot={trades}>
        <NewOrderbookProvider code={code} initialSnapshot={orderbook}>
          {children}
        </NewOrderbookProvider>
      </NewTradeProvider>
    </Suspense>
  );
}
