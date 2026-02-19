'use client';

import MarketChart from '@/components/chart/new/NewMarketChart';

export default function ChartTestClient({ code }: { code: string }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100dvh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <MarketChart code={code} />
    </div>
  );
}
