/**
 * 변화율을 부호가 있는 퍼센트 문자열로 포맷팅합니다.
 */
export function formatSignedChangeRate(rate: number): string {
  if (!Number.isFinite(rate)) return '0.00';

  // 퍼센트 기준으로 변환 (예 1.23)
  const percent = rate * 100;

  // 너무 작은 값은 0으로 처리, -0.00 안 나오게
  if (Math.abs(percent) < 0.005) {
    return '0.00';
  }

  const sign = percent > 0 ? '+' : percent < 0 ? '-' : '';
  const absVal = Math.abs(percent);

  return `${sign}${absVal.toFixed(2)}`;
}

/**
 * 변화율을 부호 없는 퍼센트 문자열로 포맷팅합니다.
 */
export function formatChangeRate(rate: number): string {
  if (!Number.isFinite(rate)) return '0.00';

  // 퍼센트 기준으로 변환 (예 1.23)
  const percent = rate * 100;

  // 너무 작은 값은 0으로 처리, -0.00 안 나오게
  if (Math.abs(percent) < 0.005) {
    return '0.00';
  }

  const absVal = Math.abs(percent);

  return `${absVal.toFixed(2)}`;
}
