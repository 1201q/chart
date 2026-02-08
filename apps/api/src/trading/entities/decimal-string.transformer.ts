import { ValueTransformer } from 'typeorm';
import {
  toDecimalString,
  safeDecimal,
  STANDARD_PRECISION,
} from '../../common/helpers/decimal';

/**
 * Decimal을 String으로 저장하는 Transformer
 * - 저장 시: 8자리 소수점으로 제한
 * - 읽기 시: Decimal 객체로 안전하게 변환
 */
export const DecimalStringTransformer: ValueTransformer = {
  /**
   * DB에 저장할 때: Decimal → 8자리 string
   */
  to: (value: any) => {
    if (value == null) {
      return null;
    }

    // 이미 Decimal 객체인 경우
    if (value.constructor?.name === 'Decimal') {
      return toDecimalString(value, STANDARD_PRECISION);
    }

    // string이나 number인 경우 Decimal로 변환 후 포맷
    try {
      const decimal = safeDecimal(value);
      return toDecimalString(decimal, STANDARD_PRECISION);
    } catch {
      return null;
    }
  },

  /**
   * DB에서 읽을 때: string → string (그대로 유지)
   * - Repository에서 사용 시 Decimal로 변환 필요
   */
  from: (value: any) => {
    if (value == null) {
      return null;
    }

    // string으로 그대로 반환
    return String(value);
  },
};

/**
 * KRW 금액 Transformer (소수점 없음)
 */
export const KRWTransformer: ValueTransformer = {
  to: (value: any) => {
    if (value == null) {
      return null;
    }

    if (value.constructor?.name === 'Decimal') {
      return value.toDecimalPlaces(0).toString();
    }

    try {
      const decimal = safeDecimal(value);
      return decimal.toDecimalPlaces(0).toString();
    } catch {
      return null;
    }
  },

  from: (value: any) => {
    if (value == null) {
      return null;
    }
    return String(value);
  },
};
