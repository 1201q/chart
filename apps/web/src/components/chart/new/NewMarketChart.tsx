'use client';

import { useState } from 'react';

import MarketChartController from './NewMarketChartController';
import styles from '../styles/market.chart.module.css';
import { UpbitCandleTimeframeUrl } from '@chart/shared-types';

import LoadingSpinner from '../../LoadingSpinner';
import { useCandleChart } from '@/hooks/chart/useCandleChartV2';

const MarketChart = ({ code }: { code: string }) => {
  const [timeframe, setTimeframe] = useState<UpbitCandleTimeframeUrl>('days');

  const { loading, chartMountRef, chartReady } = useCandleChart({
    code,
    timeframe,
  });

  const handleTimeframeChange = (newTimeframe: UpbitCandleTimeframeUrl) => {
    if (loading) return;
    setTimeframe(newTimeframe);
  };

  const showSpinner = !chartReady;

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
        {showSpinner && (
          <div className={styles.spinnerWrapper}>
            <LoadingSpinner />
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketChart;
