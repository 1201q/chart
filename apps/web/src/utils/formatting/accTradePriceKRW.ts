type AccTradePriceUnit = '' | '원' | '만' | '억' | '조';

export type FormattedAccTradePrice = {
  numeric: string; // 3,749 / 1.4 같은 숫자 부분
  unit: AccTradePriceUnit;
};

const koreanNumberFormatter = new Intl.NumberFormat('ko-KR');

export function formatAccTradePriceKRW(value: number): FormattedAccTradePrice {
  if (!Number.isFinite(value)) return { numeric: '-', unit: '' };

  // 포매터 매번 부르기 대신 미리 선언
  const fmt = (n: number) => koreanNumberFormatter.format(n);

  // 1만원 미만: 원 단위
  if (value < 10_000) {
    return {
      numeric: fmt(Math.round(value)),
      unit: '원',
    };
  }

  // 1억 미만: 만 단위
  if (value < 100_000_000) {
    const man = value / 10_000; // 만
    const displayed =
      man >= 100
        ? Math.round(man) // 100만 이상은 소수 날림
        : Math.floor(man * 10) / 10; // 그 이하는 1자리 소수
    return {
      numeric: fmt(displayed),
      unit: '만',
    };
  }

  // 1조 미만: 억 단위
  if (value < 1_000_000_000_000) {
    const uk = value / 100_000_000; // 억

    // 1000억 미만: 1자리 소수 (1.2억, 235.4억)
    if (uk < 1000) {
      const displayed = Math.floor(uk * 10) / 10;
      return {
        numeric: fmt(displayed),
        unit: '억',
      };
    }

    // 1000억 이상: 정수 억 (3,749억)
    const displayed = Math.round(uk);
    return {
      numeric: fmt(displayed),
      unit: '억',
    };
  }

  // 1조 이상: 조 단위
  const jo = value / 1_000_000_000_000;
  let displayed: number;

  if (jo < 10) {
    displayed = Math.floor(jo * 100) / 100; // 1.23조
  } else if (jo < 100) {
    displayed = Math.floor(jo * 10) / 10; // 12.3조
  } else {
    displayed = Math.round(jo); // 123조
  }

  return {
    numeric: fmt(displayed),
    unit: '조',
  };
}
