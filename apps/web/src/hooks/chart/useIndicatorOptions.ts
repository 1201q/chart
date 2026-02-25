'use client';

import { useState } from 'react';
import { CandleIndicatorOptions } from './candleIndicators';

// ==========================================
// 기본값
// ==========================================
const DEFAULT_OPTIONS: CandleIndicatorOptions = {
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
};

// ==========================================
// Hook
// ==========================================

/**
 * 지표 옵션 상태를 관리합니다.
 *
 * 현재: 기본값으로 초기화
 * 향후: localStorage에서 읽기/쓰기, 동적 추가·삭제 지원
 */
export function useIndicatorOptions(): {
  options: CandleIndicatorOptions;
  setOptions: (
    updater:
      | CandleIndicatorOptions
      | ((prev: CandleIndicatorOptions) => CandleIndicatorOptions),
  ) => void;
} {
  const [options, setOptions] = useState<CandleIndicatorOptions>(DEFAULT_OPTIONS);

  return { options, setOptions };
}
