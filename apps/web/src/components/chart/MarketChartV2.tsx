'use client';

import { useState } from 'react';

import LoadingSpinner from '../LoadingSpinner';
import styles from './styles/market.chart.module.css';
import { DEFAULT_INDICATOR_OPTIONS } from '@/hooks/chart/indicatorTypes';
import { useCandleChart } from '@/hooks/chart/useCandleChartV2';
import { UpbitCandleTimeframeUrl } from '@chart/shared-types';

import IndicatorPanel from './IndicatorPanel';
import MarketChartController from './MarketChartController';

const MarketChartV2 = ({ code }: { code: string }) => {
  const [timeframe, setTimeframe] = useState<UpbitCandleTimeframeUrl>('days');

  const { loading, chartMountRef, chartReady, indicatorOptions, setIndicatorOptions } =
    useCandleChart({ code, timeframe });

  const handleTimeframeChange = (newTimeframe: UpbitCandleTimeframeUrl) => {
    if (loading) return;
    setTimeframe(newTimeframe);
  };

  const showSpinner = !chartReady;

  return (
    <div className={styles.chart}>
      <div className={styles.controller}>
        <MarketChartController
          selected={timeframe}
          disabled={loading}
          handleTimeframeChange={handleTimeframeChange}
        />
        <IndicatorPanel
          options={indicatorOptions}
          onChange={setIndicatorOptions}
          onReset={() => setIndicatorOptions(DEFAULT_INDICATOR_OPTIONS)}
        />
      </div>

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

export default MarketChartV2;
