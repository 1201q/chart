// url에 사용하는 캔들 타임프레임
export type CandleTimeframeUrl = 'days' | 'weeks' | 'months' | 'years';

// db에 사용하는 캔들 타임프레임
export type CandleTimeframeDb = '1d' | '1w' | '1M' | '1Y';

export const CandleTimeframeMap: Record<CandleTimeframeUrl, CandleTimeframeDb> =
  {
    days: '1d',
    weeks: '1w',
    months: '1M',
    years: '1Y',
  };
