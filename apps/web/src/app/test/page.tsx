'use client';

import TickerClient from '@/components/TickerClient';
import TickerClient2 from '@/components/TickerClient2';
import TickerClientMemo from '@/components/TickerClientMemo';
import {
  logRenderMetrics,
  logRenderMetricsByCode,
  logRenderMetricsClients,
} from '@/utils/renderMetrics';
import { MarketTickerWithNamesMap } from '@chart/shared-types';
import { useEffect, useState } from 'react';

// const fetchData = async () => {
//   const data = await fetch('http://localhost:8000/tickers/snapshot', {
//     cache: 'no-store',
//   });

//   const json = (await data.json()) as MarketTickerWithNamesMap;
//   return json;
// };

export default function Home() {
  const [snapshot, setSnapshot] = useState<MarketTickerWithNamesMap | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch('http://localhost:8000/tickers/snapshot');
      const json = (await res.json()) as MarketTickerWithNamesMap;
      setSnapshot(json);
    })();
  }, []);

  useEffect(() => {
    const id = setTimeout(() => {
      console.log('=== RAW ===');
      logRenderMetrics();

      console.log('=== ITEM per code (A/B/C) ===');
      logRenderMetricsByCode();

      console.log('=== CLIENT summary ===');
      logRenderMetricsClients();
    }, 10000);

    return () => clearTimeout(id);
  }, []);
  if (!snapshot) return <div>Loading…</div>;

  // function onRender(id, phase, actualDuration, baseDuration, startTime, commitTime) {
  //   console.log({ id, phase, actualDuration, baseDuration, startTime, commitTime });
  // }

  return (
    <div style={{ display: 'flex', gap: 32 }}>
      {/* 기존 useTickerSse 버전 */}
      <div style={{ flex: 1 }}>
        <h2>Legacy (useTickerSse)</h2>

        <TickerClient initialSnapshot={snapshot} />
      </div>

      <div style={{ flex: 1 }}>
        <h2>Legacy-item(memo)</h2>

        <TickerClientMemo initialSnapshot={snapshot} />
      </div>

      {/* external store + useSyncExternalStore 버전 */}
      <div style={{ flex: 1 }}>
        <h2>Store (useTickerSse2)</h2>

        <TickerClient2 initialSnapshot={snapshot} />
      </div>
    </div>
  );
}
