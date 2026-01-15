import { NewOrderbookProvider } from '@/components/provider/NewOrderbookProvider';
import { NewTradeProvider } from '@/components/provider/NewTradeProvider';
import { TradeProvider } from '@/components/provider/TradeProvider';
import { MarketTradeWithId } from '@chart/shared-types';
import { MarketOrderbook } from '@chart/shared-types';

async function fetchTradeSnapshot(code: string): Promise<MarketTradeWithId[]> {
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

  const snapshot = await fetchTradeSnapshot(code);
  const orderbook = await fetchOrderbook(code);

  return (
    <NewTradeProvider code={code} initialSnapshot={snapshot}>
      <NewOrderbookProvider code={code} initialSnapshot={orderbook}>
        {children}
      </NewOrderbookProvider>
    </NewTradeProvider>
  );
}
