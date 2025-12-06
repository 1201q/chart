import type { MarketTrade } from '@chart/shared-types';
import { TradeBenchClient } from './_testClient';

async function fetchTradeSnapshot(code: string): Promise<MarketTrade[]> {
  const res = await fetch(`http://localhost:8000/trades/${code}`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    return [];
  }

  return res.json();
}

export default async function TradeBenchPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const snapshot = await fetchTradeSnapshot(code);

  return <TradeBenchClient code={code} initialSnapshot={snapshot} />;
}
