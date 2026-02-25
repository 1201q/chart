'use client';

import { CandlestickData } from 'lightweight-charts';
import { useEffect, useEffectEvent } from 'react';

import { UpbitCandleTimeframeUrl } from '@chart/shared-types';
import { compareCandle } from '@/utils/date';
import { useTickerSelector2 } from '../uses/tickers.hooks';
import { ChartInstanceRefs } from './useChartInstance';

// ==========================================
// Hook
// ==========================================

/**
 * 실시간 티커 가격을 차트의 마지막 캔들에 동기화합니다.
 */
export function useChartTickerSync(
  refs: Pick<ChartInstanceRefs, 'candleSeriesRef'>,
  code: string,
  timeframe: UpbitCandleTimeframeUrl,
): void {
  const tickerTradePrice = useTickerSelector2(code, (t) => t?.tradePrice ?? 0);
  const tickerTimestamp = useTickerSelector2(code, (t) => t?.timestamp ?? 0);

  /**
   * useEffectEvent:
   * tickerTradePrice/tickerTimestamp 변경이 유일한 트리거.
   */
  const syncToChart = useEffectEvent(() => {
    const candleSeries = refs.candleSeriesRef.current;
    if (!candleSeries) return;

    const data = candleSeries.data() as CandlestickData[];
    if (!data || data.length === 0) return;

    const last = data[data.length - 1];
    const lastUnixTime = last.time as number;

    const compare = compareCandle(lastUnixTime, tickerTimestamp, timeframe);

    if (compare === 'same') {
      const updatedCandle: CandlestickData = {
        time: last.time,
        open: last.open,
        high: Math.max(last.high, tickerTradePrice),
        low: Math.min(last.low, tickerTradePrice),
        close: tickerTradePrice,
      };
      candleSeries.update(updatedCandle);
    }
  });

  useEffect(() => {
    if (!tickerTradePrice || !tickerTimestamp) return;
    syncToChart();
  }, [tickerTradePrice, tickerTimestamp]);
}
