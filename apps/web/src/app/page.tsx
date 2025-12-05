'use client';

import SideCoinList from '@/components/coinList/SideCoinList';

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
    <div style={{ display: 'flex', height: '100dvh' }}>
      <div
        style={{
          flex: 1,
          backgroundColor: '#f2f4f6',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ display: 'flex', flex: 1 }}>
          <div style={{ flex: 1 }}>{/* <MarketChartController /> */}</div>
          <div style={{ width: '250px', borderLeft: '1px solid rgb(225, 228, 238)' }}>
            오더
          </div>
        </div>
      </div>

      <div style={{ borderLeft: '1px solid rgb(225, 228, 238)' }}>
        <SideCoinList />
      </div>
    </div>
  );
}
