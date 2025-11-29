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
  LineData,
  LineSeries,
  TickMarkType,
} from 'lightweight-charts';
import { useCallback, useEffect, useRef, useState } from 'react';

import { UpbitCandleTimeframeUrl, CandleResponseDto } from '@chart/shared-types';
import { formatKoreanVolume } from '@/utils/formatting/volume';
import { createKrwPriceFormatter } from '@/utils/formatting/price';

export interface UseChartOptions {
  code: string;
  timeframe: UpbitCandleTimeframeUrl;
  count?: number;
  to?: string;
}

export const getCssVar = (name: string) => {
  if (typeof window === 'undefined') return '';
  const root = document.documentElement;
  return getComputedStyle(root).getPropertyValue(name).trim();
};

export function useCandleChart(options: UseChartOptions) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ReturnType<IChartApi['addSeries']> | null>(null);
  const volumeSeriesRef = useRef<ReturnType<IChartApi['addSeries']> | null>(null);

  // 이동평균 시리즈 ref
  const maSeriesRef = useRef<ReturnType<IChartApi['addSeries']> | null>(null);

  const [loading, setLoading] = useState(true);
  const loadingMoreRef = useRef(false); // 스크롤 중복 fetch 방지
  const hasMoreRef = useRef(true); // 더이상 가져올 데이터 없는 경우 막기

  const formatKrwPrice = (price: number): string => {
    if (!Number.isFinite(price)) return '-';
    const f = createKrwPriceFormatter(price);
    return f.formatPrice(price);
  };

  // 문자열 -> UNIX 타임 (초 단위) 변환
  const parseTimeToUnix = (iso: string): Time => {
    return Math.floor(new Date(iso).getTime() / 1000) as Time;
  };

  const calcSma = useCallback((candles: CandlestickData[], period = 20): LineData[] => {
    if (!candles.length) return [];

    const result: LineData[] = [];
    let sum = 0;
    const closes = candles.map((c) => c.close);

    for (let i = 0; i < candles.length; i++) {
      sum += closes[i];

      if (i >= period) {
        sum -= closes[i - period];
      }

      if (i >= period - 1) {
        const avg = sum / period;
        result.push({
          time: candles[i].time,
          value: avg,
        });
      }
    }

    return result;
  }, []);

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
  const fetchCandles = useCallback(async (params: UseChartOptions) => {
    const { to, code, timeframe, count = 200 } = params;
    if (!code || !timeframe) return [];

    const url = `http://localhost:8000/candles/test/${encodeURIComponent(
      timeframe,
    )}/${encodeURIComponent(code)}?count=${count}${
      to ? `&to=${encodeURIComponent(to)}` : ''
    }`;

    try {
      const res = await fetch(url, { cache: 'no-cache' });
      if (!res.ok) return [];

      return (await res.json()) as CandleResponseDto[];
    } catch {
      return [];
    }
  }, []);

  // =====================================================
  // 차트 생성 (한 번만)
  // =====================================================
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();

    const chart = createChart(containerRef.current, {
      autoSize: false,
      width: rect.width,
      height: 500,

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

    // 이동 평균 추가
    maSeriesRef.current = chart.addSeries(
      LineSeries,
      {
        lineWidth: 2,
        color: getCssVar('--red200'),
        crosshairMarkerVisible: false,
        priceLineVisible: false,
        lastValueVisible: false,
      },
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
      panes[0].setStretchFactor(0.7);
      panes[1].setStretchFactor(0.3);
    }

    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;

      const { width, height } = entry.contentRect;
      chart.applyOptions({ width, height });
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
      maSeriesRef.current = null;
    };
  }, []);

  // =====================================================
  // 초기 데이터 로드 + 이동평균 계산
  // =====================================================
  useEffect(() => {
    if (!chartRef.current) return;
    const { code, timeframe, count, to } = options;
    if (!code || !timeframe) return;

    let cancelled = false;
    hasMoreRef.current = true; // 새로운 종목/타임프레임에서는 다시 true로

    const load = async () => {
      setLoading(true);

      const raw = await fetchCandles({ code, timeframe, count, to });
      if (
        cancelled ||
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

      // 이동평균 계산 및 세팅
      if (maSeriesRef.current) {
        const maData = calcSma(candles, 20);
        maSeriesRef.current.setData(maData);
      }

      chartRef.current.timeScale().fitContent();

      // 만약 받아온 개수가 count보다 적다면, 더 이상 가져올 게 없다고 표시
      if ((options.count ?? 200) > raw.length) {
        hasMoreRef.current = false;
      }

      setLoading(false);
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [
    options.code,
    options.timeframe,
    options.count,
    options.to,
    fetchCandles,
    mapDtoToSeriesData,
    options,
    calcSma,
  ]);

  // =====================================================
  // 스크롤 시 더불러오기
  // =====================================================
  useEffect(() => {
    if (!chartRef.current || !candleSeriesRef.current) return;

    const timeScale = chartRef.current.timeScale();

    const handler = async () => {
      if (loadingMoreRef.current) return;
      if (!hasMoreRef.current) return;

      const pos = timeScale.scrollPosition();
      // scrollPosition이 왼쪽으로 충분히 간 경우만
      if (pos === null || pos > 5) return;

      const series = candleSeriesRef.current!;
      const existing = series.data() as CandlestickData[];

      if (!existing || existing.length === 0) return;

      loadingMoreRef.current = true;

      // 현재 로드된 가장 오래된 캔들 시간
      const first = existing[0];
      const firstTimeUnix = first.time as number; // seconds
      const firstISO = new Date(firstTimeUnix * 1000).toISOString();

      // 이 시점 기준으로 더 과거 데이터 요청
      const raw = await fetchCandles({
        code: options.code,
        timeframe: options.timeframe,
        to: firstISO,
        count: options.count ?? 200,
      });

      if (!raw || raw.length === 0) {
        hasMoreRef.current = false;
        loadingMoreRef.current = false;
        return;
      }

      const { candles, volumes } = mapDtoToSeriesData(raw);

      // ====== 중복 제거 포인트 ======
      const filteredCandles = candles.filter((c) => (c.time as number) < firstTimeUnix);
      const filteredVolumes = volumes.filter((v) => (v.time as number) < firstTimeUnix);

      if (filteredCandles.length === 0) {
        // 전부 겹치는 데이터라면 더 이상 과거 데이터 없음
        hasMoreRef.current = false;
        loadingMoreRef.current = false;
        return;
      }

      const mergedCandles = [...filteredCandles, ...existing];

      // 새 데이터 + 기존 데이터 머지 (시간 오름차순 유지)
      series.setData(mergedCandles);

      const vSeries = volumeSeriesRef.current!;
      const oldV = vSeries.data() as HistogramData[];
      vSeries.setData([...filteredVolumes, ...oldV]);

      // 이동평균 다시 계산 및 세팅
      if (maSeriesRef.current) {
        const smaData = calcSma(mergedCandles, 20);
        maSeriesRef.current.setData(smaData);
      }

      // 응답 개수가 count보다 적으면 더 이상 없음
      if ((options.count ?? 200) > raw.length) {
        hasMoreRef.current = false;
      }

      loadingMoreRef.current = false;
    };

    timeScale.subscribeVisibleLogicalRangeChange(handler);

    return () => {
      timeScale.unsubscribeVisibleLogicalRangeChange(handler);
    };
  }, [
    fetchCandles,
    mapDtoToSeriesData,
    options.code,
    options.timeframe,
    options.count,
    calcSma,
  ]);

  return { loading, containerRef };
}
