import { FractionDigits, getKrwNumberFormatter } from './price';

export type KrwVolumeFormatter = {
  formatVolume: (volume: number) => string;
};

export const formatKoreanVolume = (scaled: number) => {
  const raw = scaled * 1_000_000; // 100만 곱하기

  if (raw >= 1e12) {
    return (raw / 1e12).toFixed(2) + 'T';
  } else if (raw >= 1e9) {
    return (raw / 1e9).toFixed(2) + 'B';
  } else if (raw >= 1e6) {
    return (raw / 1e6).toFixed(2) + 'M';
  } else if (raw >= 1e3) {
    return (raw / 1e3).toFixed(3) + 'K';
  }

  return raw.toLocaleString('ko-KR', { maximumFractionDigits: 2 });
};

function getVolumeFractionDigits(basePrice: number): FractionDigits {
  if (basePrice >= 10) {
    // 10원 이상: 항상 소수점 3자리
    return { minFractionDigits: 3, maxFractionDigits: 3 };
  }
  // 10원 미만: 소수점 없음
  return { minFractionDigits: 0, maxFractionDigits: 0 };
}

export function createKrwVolumeFormatter(basePrice: number): KrwVolumeFormatter {
  if (!Number.isFinite(basePrice)) {
    return {
      formatVolume: () => '-',
    };
  }

  const fd = getVolumeFractionDigits(basePrice);
  const formatter = getKrwNumberFormatter(fd);

  const formatVolume = (volume: number): string => {
    if (!Number.isFinite(volume)) return '-';

    // 0일 때는 깔끔하게 "0"으로
    if (volume === 0) return '0';

    return formatter.format(volume);
  };

  return { formatVolume };
}
