'use client';

import { CandlestickData, HistogramData } from 'lightweight-charts';
import { useEffect, useEffectEvent, useRef, useState } from 'react';

import { UpbitCandleTimeframeUrl } from '@chart/shared-types';
import { formatChartDate } from '@/utils/formatting/chartDate';
import { CandleIndicatorOptions } from './candleIndicators';
import { fetchCandlesApi, mapDtoToSeriesData } from './candleHelpers';
import { ChartInstanceRefs } from './useChartInstance';

// ==========================================
// Types
// ==========================================
export interface ChartDataOptions {
  code: string;
  timeframe: UpbitCandleTimeframeUrl;
  count?: number;
  to?: string;
}

// ==========================================
// Hook
// ==========================================

/**
 * 차트 데이터 페칭 및 무한 스크롤을 담당합니다.
 *
 * - 초기 로드: code/timeframe 변경 시 데이터를 fetch하여 시리즈에 set
 * - 무한 스크롤: 좌측 스크롤 시 과거 데이터 추가 로드
 */
export function useChartData(
  refs: ChartInstanceRefs,
  options: ChartDataOptions,
  indicatorOptions: CandleIndicatorOptions,
): {
  loading: boolean;
} {
  const { code, timeframe, count, to } = options;

  const [loading, setLoading] = useState(true);

  const loadingMoreRef = useRef(false);
  const hasMoreRef = useRef(true);

  // =====================================================
  // 초기 데이터 로드
  // =====================================================
  useEffect(() => {
    if (!refs.chartRef.current) return;
    if (!code || !timeframe) return;

    const ac = new AbortController();
    let cancelled = false;
    hasMoreRef.current = true;

    (async () => {
      setLoading(true);

      const raw = await fetchCandlesApi({ code, timeframe, count, to }, ac.signal);

      if (
        cancelled ||
        ac.signal.aborted ||
        !refs.chartRef.current ||
        !refs.candleSeriesRef.current ||
        !refs.volumeSeriesRef.current
      ) {
        setLoading(false);
        return;
      }

      if (raw.length === 0) {
        hasMoreRef.current = false;
        setLoading(false);
        return;
      }

      const { candles, volumes } = mapDtoToSeriesData(raw);

      // 데이터 세팅 전 timeScale 리셋 → 처음부터 맨 오른쪽에서 시작
      refs.chartRef.current.timeScale().resetTimeScale();

      refs.candleSeriesRef.current.setData(candles);
      refs.volumeSeriesRef.current.setData(volumes);

      refs.indicatorManagerRef.current?.apply(candles, indicatorOptions, volumes);

      refs.chartRef.current.applyOptions({
        localization: {
          locale: 'ko-KR',
          dateFormat: formatChartDate(timeframe),
        },
      });

      if ((count ?? 200) > raw.length) {
        hasMoreRef.current = false;
      }

      setLoading(false);
    })();

    return () => {
      cancelled = true;
      ac.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, timeframe, count, to]);

  // =====================================================
  // 스크롤 시 더불러오기
  // =====================================================
  const onLoadMore = useEffectEvent(async (signal: AbortSignal) => {
    if (loadingMoreRef.current) return;
    if (!hasMoreRef.current) return;

    const chart = refs.chartRef.current;
    if (!chart) return;

    const timeScale = chart.timeScale();
    const range = timeScale.getVisibleLogicalRange();
    if (!range) return;

    if (range.from > 5) return;

    const series = refs.candleSeriesRef.current;
    const vSeries = refs.volumeSeriesRef.current;
    if (!series || !vSeries) return;

    const existing = series.data() as CandlestickData[];
    if (!existing || existing.length === 0) return;

    loadingMoreRef.current = true;

    try {
      // 현재 로드된 가장 오래된 캔들 시간
      const first = existing[0];
      const firstTimeUnix = first.time as number;
      const firstISO = new Date(firstTimeUnix * 1000).toISOString();

      const raw = await fetchCandlesApi(
        {
          code,
          timeframe,
          to: firstISO,
          count: count ?? 200,
        },
        signal,
      );

      // 언마운트 체크
      if (
        signal.aborted ||
        !refs.chartRef.current ||
        !refs.candleSeriesRef.current ||
        !refs.volumeSeriesRef.current
      ) {
        return;
      }

      if (!raw || raw.length === 0) {
        hasMoreRef.current = false;
        return;
      }

      const { candles, volumes } = mapDtoToSeriesData(raw);

      // 중복 제거
      const filteredCandles = candles.filter((c) => (c.time as number) < firstTimeUnix);
      const filteredVolumes = volumes.filter((v) => (v.time as number) < firstTimeUnix);

      if (filteredCandles.length === 0) {
        hasMoreRef.current = false;
        return;
      }

      const mergedCandles = [...filteredCandles, ...existing];

      refs.candleSeriesRef.current.setData(mergedCandles);

      const oldV = refs.volumeSeriesRef.current.data() as HistogramData[];
      const mergedVolumes = [...filteredVolumes, ...oldV];
      refs.volumeSeriesRef.current.setData(mergedVolumes);

      // 이동평균 다시 계산
      refs.indicatorManagerRef.current?.apply(
        mergedCandles,
        indicatorOptions,
        mergedVolumes,
      );

      if ((count ?? 200) > raw.length) {
        hasMoreRef.current = false;
      }
    } finally {
      loadingMoreRef.current = false;
    }
  });

  useEffect(() => {
    const chart = refs.chartRef.current;
    if (!chart) return;

    const ac = new AbortController();
    const timeScale = chart.timeScale();

    const handler = () => {
      onLoadMore(ac.signal);
    };

    timeScale.subscribeVisibleLogicalRangeChange(handler);

    return () => {
      ac.abort();
      timeScale.unsubscribeVisibleLogicalRangeChange(handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { loading };
}
