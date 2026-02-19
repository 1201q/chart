import { Dayjs } from 'dayjs';
import { dayjs } from './dayjs';
import { UpbitCandleTimeframeUrl } from '@chart/shared-types';

export type TimestampLike = number | string | Date;
export type BucketRelation = 'past' | 'same' | 'future';

export function toUtc(value: TimestampLike): Dayjs {
  if (value instanceof Date) {
    return dayjs(value).utc();
  }

  if (typeof value === 'number') {
    if (value > 1e11) {
      // ms
      return dayjs.utc(value);
    }
    // seconds
    return dayjs.unix(value).utc();
  }

  // string (ISO 등)
  return dayjs.utc(value);
}

export function getCandleStart(
  value: TimestampLike,
  timeframe: UpbitCandleTimeframeUrl,
): Dayjs {
  const utcDate = toUtc(value);

  switch (timeframe) {
    case 'days':
      return utcDate.startOf('day');
    case 'weeks':
      return utcDate.startOf('week');
    case 'months':
      return utcDate.startOf('month');
    case 'years':
      return utcDate.startOf('year');
    case '1m':
      return utcDate.startOf('minute');
    case '3m':
      return utcDate.startOf('minute').subtract(utcDate.minute() % 3, 'minute');
    case '5m':
      return utcDate.startOf('minute').subtract(utcDate.minute() % 5, 'minute');
    case '10m':
      return utcDate.startOf('minute').subtract(utcDate.minute() % 10, 'minute');
    case '15m':
      return utcDate.startOf('minute').subtract(utcDate.minute() % 15, 'minute');
    case '30m':
      return utcDate.startOf('minute').subtract(utcDate.minute() % 30, 'minute');
    case '60m':
      return utcDate.startOf('hour');
    case '240m':
      return utcDate.startOf('hour').subtract(utcDate.hour() % 4, 'hour');
  }
}

export function getCandleKey(
  value: TimestampLike,
  timeframe: UpbitCandleTimeframeUrl,
): string {
  const start = getCandleStart(value, timeframe);

  switch (timeframe) {
    case 'days':
      return start.format('YYYY-MM-DD');
    case 'weeks':
      return start.format('YYYY-[W]WW');
    case 'months':
      return start.format('YYYY-MM');
    case 'years':
      return start.format('YYYY');
    case '1m':
    case '3m':
    case '5m':
    case '10m':
    case '15m':
    case '30m':
    case '60m':
    case '240m':
      return start.format('YYYY-MM-DD HH:mm');
  }
}

export function compareCandle(
  base: TimestampLike,
  candidate: TimestampLike,
  timeframe: UpbitCandleTimeframeUrl,
): BucketRelation {
  const baseStart = getCandleStart(base, timeframe);
  const candidateStart = getCandleStart(candidate, timeframe);

  if (candidateStart.isSame(baseStart)) return 'same';
  if (candidateStart.isAfter(baseStart)) return 'future';
  return 'past';
}

export function isSameCandle(
  base: TimestampLike,
  candidate: TimestampLike,
  timeframe: UpbitCandleTimeframeUrl,
): boolean {
  return compareCandle(base, candidate, timeframe) === 'same';
}

export function isAfterCandle(
  base: TimestampLike,
  candidate: TimestampLike,
  timeframe: UpbitCandleTimeframeUrl,
): boolean {
  return compareCandle(base, candidate, timeframe) === 'future';
}
