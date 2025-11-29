'use client';

import { RefObject } from 'react';

const MarketCandleChart = ({
  containerRef,
  loading,
}: {
  containerRef: RefObject<HTMLDivElement | null>;
  loading: boolean;
}) => {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      {loading && <div style={{ minHeight: 500 }}>로딩 중…</div>}
      <div ref={containerRef} style={{}} />
    </div>
  );
};

export default MarketCandleChart;
