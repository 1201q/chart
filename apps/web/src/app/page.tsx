'use client';

import TickerClient2 from '@/components/TickerClient2';

import { MarketTickerWithNamesMap } from '@chart/shared-types';
import { useEffect, useState } from 'react';

export default function Home() {
  const [snapshot, setSnapshot] = useState<MarketTickerWithNamesMap | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch('http://localhost:8000/tickers/snapshot');
      const json = (await res.json()) as MarketTickerWithNamesMap;
      setSnapshot(json);
    })();
  }, []);

  if (!snapshot) return <div>Loading…</div>;

  return (
    <div style={{ display: 'flex', gap: 32 }}>
      {/* 기존 useTickerSse 버전 */}

      <div style={{ flex: 1 }}>
        <h2>Store (useTickerSse2)</h2>

        <TickerClient2 initialSnapshot={snapshot} />
      </div>
    </div>
  );
}
