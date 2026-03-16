export type PerfEventType =
  | 'web-vital'
  | 'route-start'
  | 'route-commit'
  | 'fetch'
  | 'sse'
  | 'suspense'
  | 'react-profiler'
  | 'custom';

export interface PerfEvent {
  type: PerfEventType;
  name: string;
  ts: number;
  route?: string;
  duration?: number;
  url?: string;
  detail?: Record<string, unknown>;
}

declare global {
  interface Window {
    __chartPerfEvents__?: PerfEvent[];
    __chartCurrentNav__?: {
      id: string;
      url: string;
      navigationType: 'push' | 'replace' | 'traverse' | 'initial';
      startedAt: number;
      startMark: string;
    };
  }
}

function isClient() {
  return typeof window !== 'undefined';
}

function safeStringify(value: unknown) {
  try {
    return JSON.stringify(value);
  } catch {
    return JSON.stringify({ error: 'stringify_failed' });
  }
}

export function emitPerfEvent(event: PerfEvent) {
  if (isClient()) {
    window.__chartPerfEvents__ ??= [];
    window.__chartPerfEvents__!.push(event);

    if (process.env.NODE_ENV !== 'production') {
      console.debug('[chart:perf]', event);
    }

    if (process.env.NEXT_PUBLIC_ENABLE_PERF_BEACON === '1' && navigator.sendBeacon) {
      const body = safeStringify(event);
      const blob = new Blob([body], { type: 'application/json' });
      navigator.sendBeacon('/api/perf', blob);
    }

    return;
  }

  // 서버에서도 남겨두면 Vercel/Node 로그로 확인 가능
  console.info('[chart:perf]', safeStringify(event));
}

export function nowMs(): number {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return performance.now();
  }
  return Date.now();
}

export function currentRoute(): string | undefined {
  if (!isClient()) return undefined;
  return `${window.location.pathname}${window.location.search}`;
}
