import { CandlestickData, HistogramData, Time } from 'lightweight-charts';
import { CandleResponseDto, UpbitCandleTimeframeUrl } from '@chart/shared-types';
import { createKrwPriceFormatter } from '@/utils/formatting/price';

// ==========================================
// CSS 변수 읽기
// ==========================================
export const getCssVar = (name: string): string => {
  if (typeof window === 'undefined') return '';
  const root = document.documentElement;
  return getComputedStyle(root).getPropertyValue(name).trim();
};

// ==========================================
// 문자열 -> UNIX 타임 (초 단위) 변환
// ==========================================
export const parseTimeToUnix = (iso: string): Time => {
  return Math.floor(new Date(iso).getTime() / 1000) as Time;
};

// ==========================================
// KRW 가격 포맷팅
// ==========================================
export const formatKrwPrice = (price: number): string => {
  if (!Number.isFinite(price)) return '-';

  const isMinus = price < 0;
  const absPrice = Math.abs(price);

  const f = createKrwPriceFormatter(absPrice);
  return isMinus ? `-${f.formatPrice(price)}` : f.formatPrice(price);
};

// ==========================================
// DTO -> 시리즈 데이터 변환
// ==========================================
export function mapDtoToSeriesData(dtos: CandleResponseDto[]): {
  candles: CandlestickData[];
  volumes: HistogramData[];
} {
  // 오래된 순으로 정렬
  const sorted = [...dtos].sort(
    (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime(),
  );

  const candles: CandlestickData[] = sorted.map((dto) => ({
    time: parseTimeToUnix(dto.time),
    open: dto.open,
    high: dto.high,
    low: dto.low,
    close: dto.close,
  }));

  // 거래량 데이터는 백만으로 나누어 표현합니다.
  const volumes: HistogramData[] = sorted.map((dto) => ({
    time: parseTimeToUnix(dto.time),
    value: dto.accVolume / 1_000_000,
    color: dto.open <= dto.close ? getCssVar('--red500') : getCssVar('--blue500'),
  }));

  return { candles, volumes };
}

// ==========================================
// 캔들 API 호출
// ==========================================
export interface FetchCandlesParams {
  code: string;
  timeframe: UpbitCandleTimeframeUrl;
  count?: number;
  to?: string;
}

export async function fetchCandlesApi(
  params: FetchCandlesParams,
  signal?: AbortSignal,
): Promise<CandleResponseDto[]> {
  const { to, code, timeframe, count = 200 } = params;

  if (!code || !timeframe) return [];

  const url = `${process.env.NEXT_PUBLIC_API_URL}/candles/test/${encodeURIComponent(
    timeframe,
  )}/${encodeURIComponent(code)}?count=${count}${to ? `&to=${encodeURIComponent(to)}` : ''}`;

  try {
    const res = await fetch(url, { cache: 'no-cache', signal });
    if (!res.ok) return [];

    return (await res.json()) as CandleResponseDto[];
  } catch (e: unknown) {
    if (e instanceof Error && e.name === 'AbortError') {
      return [];
    }
    return [];
  }
}
