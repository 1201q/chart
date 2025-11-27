'use client';

import { UpbitCandleTimeframeUrl } from '@chart/shared-types';
import { useCandleChart } from '@/hooks/useCandleChart';

const MarketChart = ({
  code,
  timeframe,
}: {
  code: string;
  timeframe: UpbitCandleTimeframeUrl;
}) => {
  const { loading, containerRef } = useCandleChart({ code, timeframe });

  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      {loading && <div>로딩 중…</div>}
      <div ref={containerRef} style={{}} />
    </div>
  );
};

export default MarketChart;
