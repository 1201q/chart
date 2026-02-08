export const QUEUE = {
  CMC_TRANSLATE: 'cmc-translate',
  ICON_UPLOAD: 'icon-upload',
  ORDER_MATCHING: 'order-matching',
  CANDLE_RECOVERY: 'candle-recovery',
} as const;

export const JOB = {
  CMC_TRANSLATE_ONE: 'cmc-translate-one',
  ICON_UPLOAD_ONE: 'icon-upload-one',
  MATCH_ACTIVE_MARKETS: 'match-active-markets',
  RECOVER_MISSING_CANDLES: 'recover-missing-candles',
} as const;
