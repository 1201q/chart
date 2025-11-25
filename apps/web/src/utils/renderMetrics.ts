'use client';

type Counter = {
  renders: number;
};

const GLOBAL_KEY = '__ticker_bench__';

function getStore(): Record<string, Counter> {
  if (typeof window === 'undefined') {
    return {};
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyWindow = window as any;
  if (!anyWindow[GLOBAL_KEY]) {
    anyWindow[GLOBAL_KEY] = {};
  }
  return anyWindow[GLOBAL_KEY] as Record<string, Counter>;
}

export function useRenderMetric(id: string) {
  if (typeof window === 'undefined') return;

  const store = getStore();
  if (!store[id]) {
    store[id] = { renders: 0 };
  }
  store[id].renders += 1;
}

export function logRenderMetrics() {
  if (typeof window === 'undefined') return;

  const store = getStore();
  console.table(
    Object.entries(store).map(([id, c]) => ({
      id,
      renders: c.renders,
    })),
  );
}

/** ⬇⬇ 여기부터 추가 ⬇⬇ */

// 코인별 A/B/C ITEM 렌더 횟수 비교
export function logRenderMetricsByCode() {
  if (typeof window === 'undefined') return;
  const store = getStore();

  // code -> { A, B, C }
  const byCode: Record<string, { A: number; B: number; C: number }> = {};

  for (const [id, counter] of Object.entries(store)) {
    // 예: "A:ITEM:KRW-BTC"
    const [version, kind, code] = id.split(':');
    if (kind !== 'ITEM' || !code) continue;

    if (!byCode[code]) {
      byCode[code] = { A: 0, B: 0, C: 0 };
    }

    if (version === 'A' || version === 'B' || version === 'C') {
      byCode[code][version] += counter.renders;
    }
  }

  console.table(
    Object.entries(byCode).map(([code, v]) => ({
      code,
      A: v.A,
      B: v.B,
      C: v.C,
    })),
  );
}

// 버전별 CLIENT 렌더 횟수 비교
export function logRenderMetricsClients() {
  if (typeof window === 'undefined') return;
  const store = getStore();

  const result: Record<string, number> = {};

  for (const [id, counter] of Object.entries(store)) {
    const [version, kind] = id.split(':'); // "A:CLIENT"
    if (kind !== 'CLIENT') continue;

    const key = `${version}:${kind}`;
    if (!result[key]) result[key] = 0;
    result[key] += counter.renders;
  }

  console.table(
    Object.entries(result).map(([id, renders]) => ({
      id,
      renders,
    })),
  );
}
