import { MarketOrderbook, MarketTickerWithNamesMap } from '@chart/shared-types';
import OrderbookBenchClient from './OrderbookBenchClient';

async function fetchOrderbook(code: string): Promise<MarketOrderbook> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orderbook/${code}`, {
    cache: 'no-store',
  });
  return res.json();
}

async function fetchSnapshot(): Promise<MarketTickerWithNamesMap> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tickers/snapshot`, {
    cache: 'no-store',
  });
  return res.json();
}

export default async function OrderbookBenchPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ tab?: string; replayId?: string }>;
}) {
  const [{ code }, { tab, replayId }] = await Promise.all([params, searchParams]);
  const [orderbook, snapshot] = await Promise.all([fetchOrderbook(code), fetchSnapshot()]);
  const closePrice = snapshot[code]?.prevClosingPrice ?? 0;

  const initialTab = tab === 'B' ? 'B' : tab === 'C' ? 'C' : 'A';

  const sseUrl = replayId
    ? `${process.env.NEXT_PUBLIC_API_URL}/sse/orderbook-replay/${replayId}`
    : `${process.env.NEXT_PUBLIC_API_URL}/sse/orderbook/${encodeURIComponent(code)}`;

  return (
    <OrderbookBenchClient
      code={code}
      initialSnapshot={orderbook}
      closePrice={closePrice}
      initialTab={initialTab}
      sseUrl={sseUrl}
    />
  );
}
