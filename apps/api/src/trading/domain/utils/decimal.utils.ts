import Decimal from 'decimal.js-light';

/**
 * Domain Layer용 Decimal 유틸리티
 * - 외부 의존성 없음
 */

/**
 * 여러 Decimal 중 작은 값 반환
 */
export function decimalMin(...values: Decimal[]): Decimal {
  if (values.length === 0) {
    throw new Error('decimalMin requires at least one argument');
  }

  return values.reduce((min, current) => (current.lt(min) ? current : min));
}

/**
 * 여러 Decimal 중 큰 값 반환
 */
export function decimalMax(...values: Decimal[]): Decimal {
  if (values.length === 0) {
    throw new Error('decimalMax requires at least one argument');
  }

  return values.reduce((max, current) => (current.gt(max) ? current : max));
}

/**
 * Decimal 0인지 확인
 */
export function isZero(value: Decimal): boolean {
  return value.eq(0);
}

/**
 * Decimal 양수인지 확인
 */
export function isPositive(value: Decimal): boolean {
  return value.gt(0);
}
