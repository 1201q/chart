export type CommitResult = {
  value: number | null; // 유효 숫자 or null
  display: string; // 입력창에 다시 넣을 문자열
};

const MAX_DECIMALS = 8;

export function sanitizeQtyRawInput(raw: string): string {
  let n = raw.replace(/[^\d.]/g, '');
  if (n === '') return '';

  const firstDot = n.indexOf('.');
  if (firstDot >= 0) {
    const before = n.slice(0, firstDot + 1);
    const after = n.slice(firstDot + 1).replace(/\./g, '');
    n = before + after;
  }

  if (n[0] === '.') n = `0${n}`;

  // 정수부 0을 정리함
  const [intPartRaw, fractionPartRaw = ''] = n.split('.');
  let intPart = intPartRaw === '' ? '0' : intPartRaw;
  if (intPart.length > 1) intPart = intPart.replace(/^0+/, '') || '0';

  // 소수점 자리 제한
  const frac = fractionPartRaw.slice(0, MAX_DECIMALS);

  return n.includes('.') ? `${intPart}.${frac}` : intPart;
}

function trimZeros(n: string) {
  if (!n.includes('.')) return n;
  n = n.replace(/0+$/, ''); // 소수점 뒤 불필요한 0 제거
  n = n.replace(/\.$/, ''); // 소수점만 남으면 제거
  return n;
}

function formatQtyDisplay(sanitized: string) {
  const trimmed = trimZeros(sanitized);
  const [intPart, fractionPart = ''] = trimmed.split('.');

  const intWithComma = Number(intPart).toLocaleString('ko-KR');

  return fractionPart ? `${intWithComma}.${fractionPart}` : intWithComma;
}

export function commitQtyValue(raw: string): CommitResult {
  const sanitized = sanitizeQtyRawInput(raw);
  if (!sanitized) return { value: null, display: '' };

  const value = Number(sanitized);
  if (!Number.isFinite(value) || value <= 0) {
    return { value: null, display: '' };
  }

  return { value, display: formatQtyDisplay(sanitized) };
}
