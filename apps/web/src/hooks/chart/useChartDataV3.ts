'use client';

import { CandlestickData, HistogramData } from 'lightweight-charts';
import { useEffect, useEffectEvent, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { UpbitCandleTimeframeUrl } from '@chart/shared-types';
import { formatChartDate } from '@/utils/formatting/chartDate';
import { IndicatorOptions } from './indicatorTypes';
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
 * 차트 데이터 페칭 및 무한 스크롤을 담당합니다 (V3: IndicatorOptions 배열 기반)
 *
 * - 초기 로드: useQuery로 캐싱 (staleTime 60s). 같은 code/timeframe 재진입 시 캐시 히트
 * - 무한 스크롤: queryClient.fetchQuery로 스크롤 페이지 캐싱 (staleTime Infinity)
 */
export function useChartDataV3(
  refs: ChartInstanceRefs,
  options: ChartDataOptions,
  indicatorOptions: IndicatorOptions,
): {
  loading: boolean;
} {
  const { code, timeframe, count, to } = options;

  const queryClient = useQueryClient();
  const loadingMoreRef = useRef(false);
  const hasMoreRef = useRef(true);
  // 거래량 데이터 캐시 (indicatorOptions 변경 시 재사용)
  const volumeDataRef = useRef<HistogramData[]>([]);

  // =====================================================
  // 초기 데이터 로드 - useQuery (캐싱)
  // =====================================================
  const { data: initialData, isLoading } = useQuery({
    queryKey: ['candles', code, timeframe, count ?? 200],
    queryFn: ({ signal }) => fetchCandlesApi({ code, timeframe, count, to }, signal),
    staleTime: 60_000,
    enabled: !!code && !!timeframe,
  });

  useEffect(() => {
    if (!initialData || !refs.chartRef.current) return;
    if (!refs.candleSeriesRef.current) return;

    hasMoreRef.current = true;

    if (initialData.length === 0) {
      hasMoreRef.current = false;
      return;
    }

    const { candles, volumes } = mapDtoToSeriesData(initialData);

    // 데이터 세팅 전 timeScale 리셋 → 처음부터 맨 오른쪽에서 시작
    refs.chartRef.current.timeScale().resetTimeScale();

    refs.candleSeriesRef.current.setData(candles);

    // 거래량 데이터 캐시 업데이트
    volumeDataRef.current = volumes;

    refs.indicatorManagerRef.current?.apply(candles, indicatorOptions, volumes);

    refs.chartRef.current.applyOptions({
      localization: {
        locale: 'ko-KR',
        dateFormat: formatChartDate(timeframe),
      },
    });

    if ((count ?? 200) > initialData.length) {
      hasMoreRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData]);

  // indicatorOptions가 변경될 때마다 현재 캔들 데이터로 즉시 재적용
  useEffect(() => {
    const series = refs.candleSeriesRef.current;
    if (!series || !refs.indicatorManagerRef.current) return;

    const candles = series.data() as CandlestickData[];
    if (!candles || candles.length === 0) return;

    refs.indicatorManagerRef.current.apply(
      candles,
      indicatorOptions,
      volumeDataRef.current,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indicatorOptions]);

  // =====================================================
  // 스크롤 시 더 불러오기 - queryClient.fetchQuery (캐싱)
  // =====================================================
  const onLoadMore = useEffectEvent(async () => {
    if (loadingMoreRef.current) return;
    if (!hasMoreRef.current) return;

    const chart = refs.chartRef.current;
    if (!chart) return;

    const timeScale = chart.timeScale();
    const range = timeScale.getVisibleLogicalRange();
    if (!range) return;

    if (range.from > 5) return;

    const series = refs.candleSeriesRef.current;
    if (!series) return;

    const existing = series.data() as CandlestickData[];
    if (!existing || existing.length === 0) return;

    loadingMoreRef.current = true;

    try {
      const first = existing[0];
      const firstTimeUnix = first.time as number;
      const firstISO = new Date(firstTimeUnix * 1000).toISOString();

      const raw = await queryClient.fetchQuery({
        queryKey: ['candles', code, timeframe, count ?? 200, firstISO],
        queryFn: () =>
          fetchCandlesApi({
            code,
            timeframe,
            to: firstISO,
            count: count ?? 200,
          }),
        staleTime: Infinity, // 과거 데이터는 불변 → 영구 캐시
      });

      if (!refs.chartRef.current || !refs.candleSeriesRef.current) {
        return;
      }

      if (!raw || raw.length === 0) {
        hasMoreRef.current = false;
        return;
      }

      const { candles, volumes } = mapDtoToSeriesData(raw);

      const filteredCandles = candles.filter((c) => (c.time as number) < firstTimeUnix);
      const filteredVolumes = volumes.filter((v) => (v.time as number) < firstTimeUnix);

      if (filteredCandles.length === 0) {
        hasMoreRef.current = false;
        return;
      }

      const mergedCandles = [...filteredCandles, ...existing];
      const mergedVolumes = [...filteredVolumes, ...volumeDataRef.current];
      volumeDataRef.current = mergedVolumes;

      refs.candleSeriesRef.current.setData(mergedCandles);
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

    const timeScale = chart.timeScale();
    const handler = () => onLoadMore();

    timeScale.subscribeVisibleLogicalRangeChange(handler);

    return () => {
      timeScale.unsubscribeVisibleLogicalRangeChange(handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { loading: isLoading };
}
