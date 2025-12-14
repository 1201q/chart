import { createKrwPriceFormatter } from './price';
import Decimal from 'decimal.js-light';
import { getKrwTickRule } from './rule';

export type StepDirection = 'up' | 'down';
export type CommitResult = {
  value: number | null; // 유효 숫자 or null
  display: string; // 입력창에 다시 넣을 문자열
};

export function sanitizeRawInput(raw: string): string {
  // 1. 숫자와 소수점(.)만 허용
  let n = raw.replace(/[^\d.]/g, '');

  if (n === '') return '';

  // 2. 소수점이 여러개일 경우 방지. 첫번째 소수점만 남기고 제거
  const firstDot = n.indexOf('.');
  if (firstDot >= 0) {
    const before = n.slice(0, firstDot + 1);
    const after = n.slice(firstDot + 1).replace(/\./g, '');
    n = before + after;
  }

  // 3. 첫 글자가 소수점이라면? '0.'로 변경
  if (n[0] === '.') {
    n = '0' + n;
  }

  const hasDot = n.includes('.');
  const endsWithDot = n.endsWith('.');

  const [intPartRaw, fractionPartRaw = ''] = n.split('.');

  let intPart = intPartRaw;

  if (intPart === '') {
    intPart = '0';
  } else if (intPart.length > 1 && intPart.startsWith('0')) {
    // 4. 정수부의 앞자리가 0인 경우 방지 (예: 000123 -> 123)
    intPart = intPart.replace(/^0+/, '');
    if (intPart === '') intPart = '0';
  }

  const intVal = Number(intPart);

  if (!hasDot) {
    return intPart;
  }

  // ========== 소수점 자리 제한 ==========
  let approx: number;
  if (fractionPartRaw === '') {
    approx = intVal;
  } else {
    approx = Number(`${intPart}.${fractionPartRaw}`);
  }

  if (!Number.isFinite(approx)) {
    return fractionPartRaw ? `${intPart}.${fractionPartRaw}` : intPart;
  }

  const tick = getKrwTickRule(approx);

  // 소수점 제한
  const decimalsAllowed = tick < 1 ? Math.round(Math.abs(Math.log10(tick))) : 0;

  // 1) 소수점이 있는데, 맨끝이 '.'이고 아직 소수부가 없음. (편집중)
  if (endsWithDot && fractionPartRaw === '') {
    if (decimalsAllowed === 0) {
      // 단, 허용 소수점 자릿수가 0이면 그냥 정수부만 반환
      return intPart;
    }

    // 3. 10. 이런식이면 편집 허용
    return `${intPart}.`;
  }

  // 2) 소수부가 있음 -> 자릿수 제한 적용
  if (decimalsAllowed === 0) {
    return intPart;
  }

  // 허용 자릿수 이상이라면 잘라내기
  const trimmedFraction = fractionPartRaw.slice(0, decimalsAllowed);

  // 소수부가 전부 잘려버리면 정수만
  if (!trimmedFraction) {
    return intPart;
  }

  return `${intPart}.${trimmedFraction}`;
}

/**
 * commit시 숫자로 파싱, 자릿수 규칙에 맞게 반올림, 잘라내기
 * 천단위 콤마 삽입
 */
export function commitInputValue(raw: string): CommitResult {
  const sanitized = sanitizeRawInput(raw);

  if (!sanitized) {
    return { value: null, display: '' };
  }

  const value = Number(sanitized);
  if (!Number.isFinite(value)) {
    return { value: null, display: '' };
  }

  if (value === 0) {
    return { value: 0, display: '0' }; // 0은 그냥 '0'
  }

  // 호가 단위에 맞게 스냅
  const snapped = snapToTick(value);

  const { formatPrice } = createKrwPriceFormatter(snapped);

  const display = formatPrice(snapped);

  return { value: snapped, display };
}

/***
 * stepper용
 */
export function stepPrice(currentRaw: string, direction: StepDirection): CommitResult {
  // 1) 현재 입력값을 일단 commit 기준으로 숫자화
  const { value } = commitInputValue(currentRaw);

  const base = value ?? 0;
  const baseDecimal = new Decimal(base);

  // 0 이하에서 down 누르면 그냥 0 유지
  if (direction === 'down' && baseDecimal.lte(0)) {
    return commitInputValue('0');
  }

  const tickBase = getKrwTickRule(base);
  if (!Number.isFinite(tickBase) || tickBase <= 0) {
    return commitInputValue(currentRaw);
  }

  const tickBaseDec = new Decimal(tickBase);
  let stepDec = tickBaseDec;

  if (direction === 'up') {
    const next = baseDecimal.plus(stepDec);
    return finalizeStep(next);
  } else {
    // down일경우 경계구간 고려
    const candidate = baseDecimal.minus(tickBaseDec);

    if (candidate.gt(0)) {
      const tickBelow = getKrwTickRule(candidate.toNumber());
      const tickBelowDec = new Decimal(tickBelow);

      // 아래 구간의 tick이 더 작다면 그 tick으로 스텝 조정
      if (tickBelowDec.lt(tickBaseDec)) {
        stepDec = tickBelowDec;
      }
    }

    let next = baseDecimal.minus(stepDec);

    if (next.isNegative()) {
      next = new Decimal(0);
    }

    return finalizeStep(next);
  }
}

/***
 * deimal -> 적절한 소수 자리수로 문자열 변환 후 커밋
 */
function finalizeStep(next: Decimal): CommitResult {
  const toNumber = next.toNumber();
  const nextTick = getKrwTickRule(toNumber);

  const decimals = nextTick < 1 ? Math.round(Math.abs(Math.log10(nextTick))) : 0;

  // e-표기 방지
  const nextStr = next.toFixed(decimals);

  return commitInputValue(nextStr);
}

/**
 * tick 단위에 맞게 반올림
 */
function snapToTick(value: number): number {
  if (!Number.isFinite(value)) {
    return value;
  }

  const tick = getKrwTickRule(value);
  if (!Number.isFinite(tick) || tick <= 0) {
    return value;
  }

  const dec = new Decimal(value);

  // value / tick을 구한뒤, 소수 0자리로 반올림

  const div = dec.div(tick);
  const rounded = div.toDecimalPlaces(0, Decimal.ROUND_HALF_UP);
  const snapped = rounded.mul(tick);

  return snapped.toNumber();
}
