'use client';

import { UpbitCandleTimeframeUrl } from '@chart/shared-types';
import styles from './styles/market.chart.module.css';

interface MarketChartControllerProps {
  selected: UpbitCandleTimeframeUrl;
  disabled: boolean;
  handleTimeframeChange: (newTimeframe: UpbitCandleTimeframeUrl) => void;
}

const OPTIONS = [
  { label: '일', timeframe: 'days' as UpbitCandleTimeframeUrl },
  { label: '주', timeframe: 'weeks' as UpbitCandleTimeframeUrl },
  { label: '월', timeframe: 'months' as UpbitCandleTimeframeUrl },
  { label: '년', timeframe: 'years' as UpbitCandleTimeframeUrl },
];

const MarketChartController = ({
  selected,
  handleTimeframeChange,
  disabled,
}: MarketChartControllerProps) => {
  return (
    <div className={styles.controller}>
      {OPTIONS.map((option) => (
        <button
          key={option.label}
          disabled={disabled}
          className={`${styles.button} ${selected === option.timeframe ? styles.selected : ''}`}
          onClick={() => {
            handleTimeframeChange(option.timeframe);
          }}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

export default MarketChartController;
