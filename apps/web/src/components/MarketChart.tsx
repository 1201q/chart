'use client';

import { UpbitCandleTimeframeUrl } from '@chart/shared-types';
import { useChart } from '@/hooks/useChart';

const MarketChart = ({
  code,
  timeframe,
}: {
  code: string;
  timeframe: UpbitCandleTimeframeUrl;
}) => {
  const { loading, containerRef } = useChart({ code, timeframe });

  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      {loading && <div>로딩 중…</div>}
      <div ref={containerRef} style={{}} />
    </div>
  );
};

export default MarketChart;
