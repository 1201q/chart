'use client';

import { CandlestickData, HistogramData } from 'lightweight-charts';
import { useEffect, useEffectEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef } from 'react';

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
 * 차트 데이터 페칭 및 무한 스크롤을 담당합니다
 *
 * - 초기 로드: useQuery로 캐싱 (staleTime 60s). 같은 code/timeframe 재진입 시 캐시 히트
 * - 무한 스크롤: queryClient.fetchQuery로 스크롤 페이지 캐싱 (staleTime Infinity)
 */
export function useChartDataV2(
  refs: ChartInstanceRefs,
  options: ChartDataOptions,
  indicatorOptions: CandleIndicatorOptions,
): {
  loading: boolean;
} {
  const { code, timeframe, count, to } = options;

  const queryClient = useQueryClient();
  const loadingMoreRef = useRef(false);
  const hasMoreRef = useRef(true);

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
    if (!refs.candleSeriesRef.current || !refs.volumeSeriesRef.current) return;

    hasMoreRef.current = true;

    if (initialData.length === 0) {
      hasMoreRef.current = false;
      return;
    }

    const { candles, volumes } = mapDtoToSeriesData(initialData);

    // 데이터 세팅 전 timeScale 리셋 -> 처음부터 맨 오른쪽에서 시작
    refs.chartRef.current.timeScale().resetTimeScale();

    refs.candleSeriesRef.current.setData(candles);
    refs.volumeSeriesRef.current.setData(volumes);

    refs.indicatorManagerRef.current?.apply(candles, indicatorOptions);

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

      // 언마운트 체크
      if (
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
      refs.volumeSeriesRef.current.setData([...filteredVolumes, ...oldV]);

      // 이동평균 다시 계산
      refs.indicatorManagerRef.current?.apply(mergedCandles, indicatorOptions);

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

    const handler = () => {
      onLoadMore();
    };

    timeScale.subscribeVisibleLogicalRangeChange(handler);

    return () => {
      timeScale.unsubscribeVisibleLogicalRangeChange(handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { loading: isLoading };
}
