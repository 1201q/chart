import { emitPerfEvent, nowMs } from './log';

interface FetchMetricMeta {
  name?: string;
  route?: string;
  tags?: string[];
}

export async function fetchWithMetrics(
  input: string | URL | Request,
  init?: RequestInit & { next?: NextFetchRequestConfig },
  meta?: FetchMetricMeta,
) {
  const startedAt = nowMs();
  const method = init?.method ?? 'GET';
  const url =
    typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.toString()
        : input.url;

  try {
    const res = await fetch(input, init);
    const duration = nowMs() - startedAt;

    emitPerfEvent({
      type: 'fetch',
      name: meta?.name ?? 'fetch',
      ts: Date.now(),
      route: meta?.route,
      url,
      duration,
      detail: {
        method,
        status: res.status,
        ok: res.ok,
        cache: init?.cache,
        next: init?.next,
        tags: meta?.tags,
      },
    });

    return res;
  } catch (error) {
    const duration = nowMs() - startedAt;

    emitPerfEvent({
      type: 'fetch',
      name: meta?.name ?? 'fetch-error',
      ts: Date.now(),
      route: meta?.route,
      url,
      duration,
      detail: {
        method,
        cache: init?.cache,
        message: error instanceof Error ? error.message : 'unknown_error',
      },
    });

    throw error;
  }
}
