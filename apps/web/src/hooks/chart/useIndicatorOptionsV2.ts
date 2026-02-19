'use client';

import { useEffect, useState } from 'react';

import {
  IndicatorOptions,
  loadIndicatorOptions,
  saveIndicatorOptions,
} from './indicatorTypes';

/**
 * 지표 옵션 상태를 관리합니다. (localStorage 연동 버전)
 *
 * - 초기값: localStorage에서 로드 (없으면 DEFAULT_INDICATOR_OPTIONS)
 * - 변경 시: localStorage에 자동 저장
 */
export function useIndicatorOptionsV2(): {
  options: IndicatorOptions;
  setOptions: (
    updater: IndicatorOptions | ((prev: IndicatorOptions) => IndicatorOptions),
  ) => void;
} {
  const [options, setOptions] = useState<IndicatorOptions>(loadIndicatorOptions);

  useEffect(() => {
    saveIndicatorOptions(options);
  }, [options]);

  return { options, setOptions };
}
