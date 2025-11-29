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
