'use client';

import {
  CandlestickData,
  CandlestickSeries,
  ColorType,
  createChart,
  IChartApi,
} from 'lightweight-charts';
import { useEffect, useRef, useState } from 'react';

import { formatKoreanVolume } from '@/utils/formatting/volume';
import { getCssVar, formatKrwPrice } from './candleHelpers';
import { createCandleIndicatorManagerV2 } from './candleIndicatorsV2';

// ==========================================
// Types
// ==========================================

// apply 시그니처를 공통 인터페이스로 정의하여 V1/V2 Manager 모두 허용
export interface AnyIndicatorManager {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  apply(candles: CandlestickData[], options: any, volumes: any[]): void;
  dispose(): void;
}

export interface ChartInstanceRefs {
  chartRef: React.RefObject<IChartApi | null>;
  candleSeriesRef: React.RefObject<ReturnType<IChartApi['addSeries']> | null>;
  volumeSeriesRef: React.RefObject<ReturnType<IChartApi['addSeries']> | null>;
  indicatorManagerRef: React.RefObject<AnyIndicatorManager | null>;
}

// ==========================================
// Hook
// ==========================================
export function useChartInstance(chartMountRef: React.RefObject<HTMLDivElement | null>): {
  chartReady: boolean;
  refs: ChartInstanceRefs;
} {
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ReturnType<IChartApi['addSeries']> | null>(null);
  const volumeSeriesRef = useRef<ReturnType<IChartApi['addSeries']> | null>(null);
  const indicatorManagerRef = useRef<AnyIndicatorManager | null>(null);

  const [chartReady, setChartReady] = useState(false);

  useEffect(() => {
    if (!chartMountRef.current) return;
    const mount = chartMountRef.current;

    const target = mount.parentElement;
    if (!target) return;

    const rect = target.getBoundingClientRect();
    const w = Math.floor(rect.width);
    const h = Math.floor(rect.height) || 1;

    const chart = createChart(mount, {
      autoSize: false,
      width: w,
      height: h,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
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

    // 상단 pane: 캔들
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

    indicatorManagerRef.current = createCandleIndicatorManagerV2(
      chart,
      candleSeriesRef.current,
      0,
      getCssVar,
      formatKoreanVolume,
    );

    setChartReady(true);

    // 리사이즈 관찰
    const ro = new ResizeObserver(([entry]) => {
      const rw = Math.floor(entry.contentRect.width);
      const rh = Math.floor(entry.contentRect.height);
      if (!rw || !rh) return;
      chart.resize(rw, rh);
    });
    ro.observe(target);

    return () => {
      ro.disconnect();
      indicatorManagerRef.current?.dispose();
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      indicatorManagerRef.current = null;
      setChartReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    chartReady,
    refs: {
      chartRef,
      candleSeriesRef,
      volumeSeriesRef,
      indicatorManagerRef,
    },
  };
}
