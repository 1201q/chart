'use client';

import { useState } from 'react';

import MarketChartController from './MarketChartController';
import styles from './styles/market.chart.module.css';
import { UpbitCandleTimeframeUrl } from '@chart/shared-types';
import { useCandleChart } from '@/hooks/chart/useCandleChart';

const MarketChart = ({ code }: { code: string }) => {
  const [timeframe, setTimeframe] = useState<UpbitCandleTimeframeUrl>('days');

  const { loading, chartMountRef } = useCandleChart({
    code,
    timeframe,
  });

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

      <div className={styles.chartViewport}>
        <div ref={chartMountRef} className={styles.chartMount} />
        {loading && <div className={styles.loading}></div>}
      </div>
    </div>
  );
};

export default MarketChart;
