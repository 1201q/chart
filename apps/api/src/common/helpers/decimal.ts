import Decimal from 'decimal.js-light';
import { BadRequestException } from '@nestjs/common';

/**
 * Decimal 설정 표준화
 * - 업비트 기준: 소수점 8자리
 * - 반올림 모드: ROUND_DOWN (내림)
 */
Decimal.set({
  precision: 20, // 내부 계산 정밀도 (충분히 크게)
  rounding: Decimal.ROUND_DOWN, // 기본 반올림 모드
  toExpNeg: -8, // 지수 표기 방지
  toExpPos: 20,
});

/**
 * 표준 소수점 자리수
 */
export const STANDARD_PRECISION = 8;

/**
 * Decimal 생성 헬퍼
 */
export function D(v: string | number): Decimal {
  return new Decimal(v);
}

/**
 * Decimal을 8자리 소수점 string으로 변환
 * - 초과 자리는 내림 처리
 * - 불필요한 trailing zero 제거
 */
export function toDecimalString(
  value: Decimal,
  precision: number = STANDARD_PRECISION,
): string {
  // 지정된 자리수로 내림
  const truncated = value.toDecimalPlaces(precision, Decimal.ROUND_DOWN);

  // string으로 변환 (trailing zero 자동 제거됨)
  return truncated.toString();
}

/**
 * formatDecimal: Decimal 또는 string을 8자리 포맷으로 변환
 * - Decimal 객체 또는 string 모두 받을 수 있음
 * - DB에서 읽어온 string 값도 직접 포맷 가능
 */
export function formatDecimal(
  value: Decimal | string | number,
  precision: number = STANDARD_PRECISION,
): string {
  const decimal = value instanceof Decimal ? value : new Decimal(value);
  return toDecimalString(decimal, precision);
}

/**
 * Decimal을 8자리 소수점 number로 변환
 * - 주의: JavaScript number의 정밀도 한계로 인해 작은 값에서만 사용
 */
export function toDecimalNumber(
  value: Decimal,
  precision: number = STANDARD_PRECISION,
): number {
  return parseFloat(toDecimalString(value, precision));
}

/**
 * 가격 포맷 (8자리)
 */
export function formatPrice(price: Decimal): string {
  return toDecimalString(price, STANDARD_PRECISION);
}

/**
 * 수량 포맷 (8자리)
 */
export function formatQuantity(qty: Decimal): string {
  return toDecimalString(qty, STANDARD_PRECISION);
}

/**
 * KRW 금액 포맷 (소수점 없음)
 */
export function formatKRW(amount: Decimal): string {
  return amount.toDecimalPlaces(0, Decimal.ROUND_DOWN).toString();
}

/**
 * 백분율 계산 (소수점 2자리)
 */
export function calculatePercentage(value: Decimal, total: Decimal): string {
  if (total.eq(0)) {
    return '0';
  }

  const percentage = value.div(total).mul(100);
  return percentage.toDecimalPlaces(2).toString();
}

/**
 * Decimal 검증 및 파싱
 */
export function parsePositiveDecimal(input: string, field: string): Decimal {
  let d: Decimal;

  try {
    d = D(input);
  } catch {
    throw new BadRequestException(`Invalid ${field}`);
  }

  const s = d.toString();
  if (s === 'NaN' || s === 'Infinity' || s === '-Infinity') {
    throw new BadRequestException(`Invalid ${field}`);
  }

  if (d.lte(0)) {
    throw new BadRequestException(`${field} must be positive`);
  }

  return d;
}

/**
 * 여러 Decimal 중 작은 값 반환 (가변인자)
 */
export function decimalMin(...values: Decimal[]): Decimal {
  if (values.length === 0) {
    throw new Error('decimalMin requires at least one argument');
  }

  return values.reduce((min, current) => (current.lt(min) ? current : min));
}

/**
 * 여러 Decimal 중 큰 값 반환 (가변인자)
 */
export function decimalMax(...values: Decimal[]): Decimal {
  if (values.length === 0) {
    throw new Error('decimalMax requires at least one argument');
  }

  return values.reduce((max, current) => (current.gt(max) ? current : max));
}

/**
 * 두 Decimal 중 작은 값 (backward compatibility)
 */
export function DecimalMin(a: Decimal, b: Decimal): Decimal {
  return decimalMin(a, b);
}

/**
 * 두 Decimal 중 큰 값 (backward compatibility)
 */
export function DecimalMax(a: Decimal, b: Decimal): Decimal {
  return decimalMax(a, b);
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

/**
 * string을 Decimal로 안전하게 변환
 * - DB에서 읽어온 값 처리용
 */
export function safeDecimal(value: string | number | null | undefined): Decimal {
  if (value == null || value === '') {
    return new Decimal('0');
  }

  try {
    return new Decimal(value);
  } catch {
    return new Decimal('0');
  }
}

/**
 * Decimal 배열의 합계
 */
export function sumDecimals(values: Decimal[]): Decimal {
  return values.reduce((sum, val) => sum.plus(val), new Decimal('0'));
}
