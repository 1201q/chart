import { UpbitCandleTimeframeUrl } from '@chart/shared-types';

export function formatChartDate(timeframe: UpbitCandleTimeframeUrl): string {
  switch (timeframe) {
    case 'days':
      return 'yyyy-MM-dd';
    case 'weeks':
      return 'yyyy-MM-dd';
    case 'months':
      return 'yyyy-MM';
    case 'years':
      return 'yyyy';
    default:
      return 'yyyy-MM-dd  HH:mm';
  }
}
