'use client';

import {
  CandlestickData,
  CandlestickSeries,
  ColorType,
  createChart,
  HistogramData,
  HistogramSeries,
  IChartApi,
  Time,
} from 'lightweight-charts';
import { useCallback, useEffect, useRef, useState } from 'react';

import { UpbitCandleTimeframeUrl, CandleResponseDto } from '@chart/shared-types';
import { formatKoreanVolume } from '@/utils/formatting/volume';
import { createKrwPriceFormatter } from '@/utils/formatting/price';
import { formatChartDate } from '@/utils/formatting/chartDate';

import {
  createCandleIndicatorManager,
  CandleIndicatorManager,
  CandleIndicatorOptions,
} from './candleIndicators';
import { useTicker } from '../useTicker';

import { compareCandle } from '@/utils/date';

export interface UseChartOptions {
  code: string;
  timeframe: UpbitCandleTimeframeUrl;
  count?: number;
  to?: string;
  height?: number;
}

export const getCssVar = (name: string) => {
  if (typeof window === 'undefined') return '';
  const root = document.documentElement;
  return getComputedStyle(root).getPropertyValue(name).trim();
};

// ==========================================
// Helpers
// ==========================================
// 문자열 -> UNIX 타임 (초 단위) 변환
const parseTimeToUnix = (iso: string): Time => {
  return Math.floor(new Date(iso).getTime() / 1000) as Time;
};

// ==========================================
// Hook
// ==========================================

export function useCandleChart(options: UseChartOptions) {
  const chartMountRef = useRef<HTMLDivElement | null>(null);

  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ReturnType<IChartApi['addSeries']> | null>(null);
  const volumeSeriesRef = useRef<ReturnType<IChartApi['addSeries']> | null>(null);

  const indicatorManagerRef = useRef<CandleIndicatorManager | null>(null);
  const indicatorOptionsRef = useRef<CandleIndicatorOptions>({
    ma: {
      enabled: true,
      period: 20,
      color: 'red',
    },
    bollinger: {
      enabled: true,
      period: 20,
      k: 2,
      bandLineColor: 'green',
      bandFillColor: 'rgba(25, 200, 100, 0.1)',
    },
    evelope: {
      enabled: false,
      period: 20,
      envelopePercent: 0.1,

      bandLineColor: 'red',
      bandFillColor: 'rgba(255, 0, 0, 0.1)',
    },
  });

  const ticker = useTicker(options.code);

  const [loading, setLoading] = useState(true);
  const loadingMoreRef = useRef(false); // 스크롤 중복 fetch 방지
  const hasMoreRef = useRef(true); // 더이상 가져올 데이터 없는 경우 막기

  const formatKrwPrice = (price: number): string => {
    if (!Number.isFinite(price)) return '-';

    const isMinus = price < 0;
    const absPrice = Math.abs(price);

    const f = createKrwPriceFormatter(absPrice);
    return isMinus ? `-${f.formatPrice(price)}` : f.formatPrice(price);
  };

  const mapDtoToSeriesData = useCallback((dtos: CandleResponseDto[]) => {
    // 오래된 순으로 정렬
    const sorted = [...dtos].sort(
      (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime(),
    );

    const candles: CandlestickData[] = sorted.map((dto) => ({
      time: parseTimeToUnix(dto.time),
      open: dto.open,
      high: dto.high,
      low: dto.low,
      close: dto.close,
    }));

    // 거래량 데이터는 백만으로 나누어 표현합니다.
    // 너무 클경우 에러.
    const volumes: HistogramData[] = sorted.map((dto) => ({
      time: parseTimeToUnix(dto.time),
      value: dto.accVolume / 1_000_000, // 중요!!!! -> 향후 포맷팅
      color: dto.open <= dto.close ? getCssVar('--red500') : getCssVar('--blue500'),
    }));

    return { candles, volumes };
  }, []);

  // candles API 호출
  const fetchCandles = useCallback(
    async (params: UseChartOptions, signal?: AbortSignal, src?: string) => {
      const { to, code, timeframe, count = 200 } = params;
      console.log('fetchCandles called with:', src, params);
      if (!code || !timeframe) return [];

      const url = `${process.env.NEXT_PUBLIC_API_URL}/candles/test/${encodeURIComponent(
        timeframe,
      )}/${encodeURIComponent(code)}?count=${count}${to ? `&to=${encodeURIComponent(to)}` : ''}`;

      try {
        const res = await fetch(url, { cache: 'no-cache', signal });
        if (!res.ok) return [];

        return (await res.json()) as CandleResponseDto[];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (e: any) {
        if (e.name === 'AbortError') {
          return [];
        }

        return [];
      }
    },
    [],
  );

  const { code, timeframe, count, to } = options;

  // =====================================================
  // 차트 생성 (한 번만)
  // =====================================================
  useEffect(() => {
    if (!chartMountRef.current) return;
    const mount = chartMountRef.current;
    const rect = mount.getBoundingClientRect();

    const chart = createChart(mount, {
      autoSize: false,
      width: rect.width,
      height: options.height ?? 500,
      layout: {
        background: { type: ColorType.Solid },
        textColor: getCssVar('--grey500'),
        panes: {
          separatorColor: getCssVar('--greyOpacity300'),
          separatorHoverColor: getCssVar('--greyOpacity100'),
          enableResize: true,
        },
        fontFamily: getCssVar('--font-pretendard'),
      },
      grid: {
        vertLines: { color: getCssVar('--greyOpacity50') },
        horzLines: { color: getCssVar('--greyOpacity50') },
      },
      crosshair: {
        mode: 0,
      },
      rightPriceScale: {
        borderVisible: true,
        borderColor: getCssVar('--greyOpacity200'),
      },
      timeScale: {
        borderVisible: false,
        timeVisible: false,
        secondsVisible: false,
      },
    });

    chartRef.current = chart;

    // 상단 pane, 캔들
    candleSeriesRef.current = chart.addSeries(
      CandlestickSeries,
      {
        upColor: getCssVar('--red500'),
        downColor: getCssVar('--blue500'),

        borderVisible: false,
        wickDownColor: getCssVar('--blue500'),
        wickUpColor: getCssVar('--red500'),

        priceFormat: {
          type: 'custom',
          formatter: (price: number) => formatKrwPrice(price),
        },
      },
      0,
    );

    indicatorManagerRef.current = createCandleIndicatorManager(
      chart,
      candleSeriesRef.current,
      0,
    );

    // 하단 pane, 거래량
    volumeSeriesRef.current = chart.addSeries(
      HistogramSeries,
      {
        priceScaleId: 'volume',
        priceFormat: { type: 'custom', formatter: formatKoreanVolume },

        priceLineVisible: false,
      },
      1,
    );

    // pane 분할
    const panes = chart.panes();
    if (panes[0] && panes[1]) {
      panes[0].setStretchFactor(0.8);
      panes[1].setStretchFactor(0.2);
    }

    // wrapper 관찰
    const target = mount.parentElement;
    if (!target) return;

    const ro = new ResizeObserver(([entry]) => {
      const w = Math.floor(entry.contentRect.width);
      const h = Math.floor(entry.contentRect.height);

      if (!w || !h) return;
      // chart.applyOptions({ width: w, height: h });
      chart.resize(w, h);
      // chart.timeScale().fitContent();
    });
    ro.observe(target);

    return () => {
      ro.disconnect();
      indicatorManagerRef.current?.dispose();
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
      indicatorManagerRef.current = null;
    };
  }, []);

  // =====================================================
  // 초기 데이터 로드 + 이동평균 계산
  // =====================================================
  useEffect(() => {
    if (!chartRef.current) return;
    // const { code, timeframe, count, to } = options; 147로
    if (!code || !timeframe) return;

    const ac = new AbortController();
    let cancelled = false;
    hasMoreRef.current = true; // 새로운 종목/타임프레임에서는 다시 true로

    (async () => {
      setLoading(true);

      const raw = await fetchCandles(
        { code, timeframe, count, to },
        ac.signal,
        'initial load',
      );

      if (
        cancelled ||
        ac.signal.aborted ||
        !chartRef.current ||
        !candleSeriesRef.current ||
        !volumeSeriesRef.current
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

      candleSeriesRef.current.setData(candles);
      volumeSeriesRef.current.setData(volumes);

      indicatorManagerRef.current?.apply(candles, indicatorOptionsRef.current);

      // chartRef.current.timeScale().fitContent();

      chartRef.current.applyOptions({
        localization: {
          locale: 'ko-KR',
          dateFormat: formatChartDate(timeframe),
        },
      });

      // 만약 받아온 개수가 count보다 적다면, 더 이상 가져올 게 없다고 표시
      if ((count ?? 200) > raw.length) {
        hasMoreRef.current = false;
      }

      setLoading(false);
    })();

    return () => {
      cancelled = true;
      ac.abort();
    };
  }, [code, timeframe, count, to, fetchCandles, mapDtoToSeriesData]);

  // =====================================================
  // 스크롤 시 더불러오기
  // =====================================================
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    const ac = new AbortController();
    const timeScale = chart.timeScale();
    let disposed = false;

    const handler = async () => {
      if (disposed) return;
      if (loadingMoreRef.current) return;
      if (!hasMoreRef.current) return;

      // const pos = timeScale.scrollPosition();
      // // scrollPosition이 왼쪽으로 충분히 간 경우만
      // if (pos === null || pos > 5) return;

      const range = timeScale.getVisibleLogicalRange();
      if (!range) return;

      if (range.from > 5) return;

      const series = candleSeriesRef.current;
      const vSeries = volumeSeriesRef.current;
      if (!series || !vSeries) return;

      const existing = series.data() as CandlestickData[];
      if (!existing || existing.length === 0) return;

      loadingMoreRef.current = true;

      try {
        // 현재 로드된 가장 오래된 캔들 시간
        const first = existing[0];
        const firstTimeUnix = first.time as number; // seconds
        const firstISO = new Date(firstTimeUnix * 1000).toISOString();

        // 이 시점 기준으로 더 과거 데이터 요청
        const raw = await fetchCandles(
          {
            code: code,
            timeframe: timeframe,
            to: firstISO,
            count: count ?? 200,
          },
          ac.signal,
          'load more',
        );

        // ====== 언마운트 체크 ======
        if (
          disposed ||
          !chartRef.current ||
          !candleSeriesRef.current ||
          !volumeSeriesRef.current
        ) {
          return;
        }

        if (!raw || raw.length === 0) {
          hasMoreRef.current = false;
          return;
        }

        const { candles, volumes } = mapDtoToSeriesData(raw);

        // ====== 중복 제거 포인트 ======
        const filteredCandles = candles.filter((c) => (c.time as number) < firstTimeUnix);
        const filteredVolumes = volumes.filter((v) => (v.time as number) < firstTimeUnix);

        if (filteredCandles.length === 0) {
          // 전부 겹치는 데이터라면 더 이상 과거 데이터 없음
          hasMoreRef.current = false;
          return;
        }

        const mergedCandles = [...filteredCandles, ...existing];

        // 새 데이터 + 기존 데이터 머지 (시간 오름차순 유지)
        candleSeriesRef.current.setData(mergedCandles);

        const vSeries = volumeSeriesRef.current;
        const oldV = vSeries.data() as HistogramData[];
        vSeries.setData([...filteredVolumes, ...oldV]);

        // 이동평균 다시 계산 및 세팅
        indicatorManagerRef.current?.apply(mergedCandles, indicatorOptionsRef.current);

        // 응답 개수가 count보다 적으면 더 이상 없음
        if ((count ?? 200) > raw.length) {
          hasMoreRef.current = false;
        }
      } finally {
        loadingMoreRef.current = false;
      }
    };

    timeScale.subscribeVisibleLogicalRangeChange(handler);

    return () => {
      ac.abort();
      disposed = true;
      timeScale.unsubscribeVisibleLogicalRangeChange(handler);
    };
  }, [fetchCandles, mapDtoToSeriesData, code, timeframe, count]);

  useEffect(() => {
    if (!ticker) return;

    const candleSeries = candleSeriesRef.current;
    const volumeSeries = volumeSeriesRef.current;

    if (!candleSeries || !volumeSeries) return;

    const data = candleSeries?.data() as CandlestickData[];

    if (data?.length === 0) return;

    const last = data[data.length - 1];
    const lastUnixTime = last.time as number;
    const tickerTime = ticker.timestamp;

    const compare = compareCandle(lastUnixTime, tickerTime, timeframe);

    if (compare === 'same') {
      const updatedCandle: CandlestickData = {
        time: last.time,
        open: last.open,
        high: last.high,
        low: last.low,
        close: ticker.tradePrice,
      };
      candleSeries.update(updatedCandle);
    }
  }, [ticker, timeframe]);

  return { loading, chartMountRef };
}
