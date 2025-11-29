'use client';

import { useState } from 'react';
import MarketCandleChart from './MarketCandleChart';
import MarketChartController from './MarketChartController';
import styles from './styles/market.chart.module.css';
import { UpbitCandleTimeframeUrl } from '@chart/shared-types';
import { useCandleChart } from '@/hooks/useCandleChart';

const MarketChart = ({ code }: { code: string }) => {
  const [timeframe, setTimeframe] = useState<UpbitCandleTimeframeUrl>('days');

  const { loading, containerRef } = useCandleChart({ code, timeframe });

  const handleTimeframeChange = (newTimeframe: UpbitCandleTimeframeUrl) => {
    if (loading) return;
    setTimeframe(newTimeframe);
  };

  return (
    <div className={styles.chart}>
      <MarketChartController
        selected={timeframe}
        disabled={loading}
        handleTimeframeChange={handleTimeframeChange}
      />
      <MarketCandleChart containerRef={containerRef} loading={loading} />
    </div>
  );
};

export default MarketChart;
