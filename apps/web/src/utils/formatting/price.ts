import { getKrwTickRule } from './rule';

export type FractionDigits = {
  minFractionDigits: number;
  maxFractionDigits: number;
};

export type SignedParts = {
  sign: '' | '+' | '-'; // 부호만
  numeric: string; // "3.5", "0", "0.001" 등
};
export type KrwPriceFormatter = {
  /** 현재가 포맷 (단순 숫자만) */
  formatPrice: (value: number) => string;
  /** 어제대비 변동값: "+3.5", "-0.1", "0" 같은 전체 문자열 */
  formatDiff: (diff: number) => string;
  /** 어제대비 변동값을 부호/숫자로 분리 */
  formatDiffParts: (diff: number) => SignedParts;
};

const krwPriceFormatters = new Map<string, Intl.NumberFormat>();

function getDisplayFractionDigits(price: number, tick: number): FractionDigits {
  // 호가 단위에서 기본 소수 자릿수 계산 (예: 0.001 → 3자리)
  const baseDecimals = tick < 1 ? Math.round(Math.abs(Math.log10(tick))) : 0;

  // 기본값
  let minFractionDigits = 0;
  let maxFractionDigits = baseDecimals;

  // 10 ~ 100: 항상 소수 1자리  17-> 17.0
  if (price >= 10 && price < 100) {
    minFractionDigits = 1;
    maxFractionDigits = 1;
  }
  // 1 ~ 10: 최소 2자리 (예: 3 -> 3.00), 필요하면 2자리 이상 (예: 3.001 -> 3.001)
  else if (price >= 1 && price < 10) {
    minFractionDigits = 2;
    maxFractionDigits = Math.max(2, baseDecimals);
  }
  // 0.1 ~ 1: 최소 2자리 (0.8 → 0.80), 필요하면 3자리까지 (0.801 -> 0.801)
  else if (price >= 0.1 && price < 1) {
    minFractionDigits = 2;
    maxFractionDigits = Math.max(2, baseDecimals);
  }
  // 그 외 큰 값들: 호가 단위에 맞춰 소수 0자리 또는 1자리
  else {
    minFractionDigits = 0;
    maxFractionDigits = baseDecimals;
  }

  return { minFractionDigits, maxFractionDigits };
}

export function getKrwNumberFormatter(opts: FractionDigits): Intl.NumberFormat {
  const key = `${opts.minFractionDigits}:${opts.maxFractionDigits}`;
  const cached = krwPriceFormatters.get(key);
  if (cached) return cached;

  const fmt = new Intl.NumberFormat('ko-KR', {
    minimumFractionDigits: opts.minFractionDigits,
    maximumFractionDigits: opts.maxFractionDigits,
  });

  krwPriceFormatters.set(key, fmt);
  return fmt;
}

/**
 * 현재가 포맷터입니다.
 * 호가 단위에 따라 적절한 소수점 자릿수를 자동으로 조절합니다.
 * -는 유한한 숫자가 아닐 때 반환됩니다.
 */

export function createKrwPriceFormatter(basePrice: number): KrwPriceFormatter {
  if (!Number.isFinite(basePrice)) {
    const fallback = () => '-';
    return {
      formatPrice: fallback,
      formatDiff: fallback,
      formatDiffParts: () => ({ sign: '', numeric: '-' }),
    };
  }

  const fd = getDisplayFractionDigits(basePrice, getKrwTickRule(basePrice));
  const formatter = getKrwNumberFormatter(fd);

  /**
   * 현재가 포맷
   * @param value
   * @returns '-': 유한한 숫자가 아닐 때 반환
   */
  const formatPrice = (value: number): string => {
    if (!Number.isFinite(value)) return '-';
    if (value === 0) return '0'; // 0.0, 0.00 방지
    return formatter.format(value);
  };

  /**
   * 어제대비 변동값 부호/숫자 분리
   * 현재 가격을 기준으로 적절한 소수점 자릿수로 포맷팅합니다.

    @param diff
    @returns sign: 부호만, numeric: 숫자만
   */
  const formatDiffParts = (diff: number): SignedParts => {
    if (!Number.isFinite(diff)) return { sign: '', numeric: '-' };

    if (diff === 0) {
      // 0은 부호 없이 "0" 으로
      return { sign: '', numeric: '0' };
    }

    const sign: '+' | '-' = diff > 0 ? '+' : '-';
    const abs = Math.abs(diff);
    const numeric = formatter.format(abs);

    return { sign, numeric };
  };

  /**
   * 어제대비 변동값 부호+숫자 포맷
   * @param diff
   * @returns string으로 부호포함 반환 (분리를 원할경우 formatDiffParts 사용)
   */
  const formatDiff = (diff: number): string => {
    const { sign, numeric } = formatDiffParts(diff);
    return sign ? `${sign}${numeric}` : numeric;
  };

  return { formatPrice, formatDiff, formatDiffParts };
}
