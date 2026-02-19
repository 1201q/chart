'use client';

import { useRef } from 'react';
import { UpbitCandleTimeframeUrl } from '@chart/shared-types';
import { useChartInstance } from './useChartInstance';
import { useChartDataV2 } from './useChartDataV2';
import { useChartTickerSync } from './useChartTickerSync';
import { useIndicatorOptions } from './useIndicatorOptions';

// ==========================================
// Types
// ==========================================
export interface UseChartOptions {
  code: string;
  timeframe: UpbitCandleTimeframeUrl;
  count?: number;
  to?: string;
}

/**
 * - useChartInstance: 차트 인스턴스 생성/해제
 * - useIndicatorOptions: 지표 옵션 상태 관리
 * - useChartDataV2: 초기 데이터 로드(useQuery) + 무한 스크롤(fetchQuery)
 * - useChartTickerSync: 실시간 티커 -> 캔들 업데이트
 */
export function useCandleChart(options: UseChartOptions) {
  const chartMountRef = useRef<HTMLDivElement | null>(null);

  // 1. 차트 인스턴스 (생성, 시리즈, 리사이즈)
  const { chartReady, refs } = useChartInstance(chartMountRef);

  // 2. 지표 옵션 (localStorage 연동)
  const { options: indicatorOptions } = useIndicatorOptions();

  // 3. 데이터 페칭 (초기 로드 + 스크롤 무한 로딩) - TanStack Query 캐싱 버전
  const { loading } = useChartDataV2(refs, options, indicatorOptions);

  // 4. 실시간 티커 동기화
  useChartTickerSync(refs, options.code, options.timeframe);

  return { loading, chartMountRef, chartReady };
}
