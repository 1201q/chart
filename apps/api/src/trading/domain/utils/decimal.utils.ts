import Decimal from 'decimal.js-light';

/**
 * Domain Layer용 Decimal 유틸리티
 * - 외부 의존성 없음
 */

/**
 * 두 Decimal 중 작은 값 반환
 */
export function decimalMin(a: Decimal, b: Decimal): Decimal {
  return a.lte(b) ? a : b;
}

/**
 * 두 Decimal 중 큰 값 반환
 */
export function decimalMax(a: Decimal, b: Decimal): Decimal {
  return a.gte(b) ? a : b;
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
