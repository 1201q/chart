import { emitPerfEvent, nowMs } from '@/utils/perf/log';
import '@/utils/perf/report';

performance.mark('chart-app-init');

if (typeof window !== 'undefined') {
  window.__chartPerfEvents__ ??= [];
}

export function onRouterTransitionStart(
  url: string,
  navigationType: 'push' | 'replace' | 'traverse',
) {
  const id =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const startMark = `chart-nav-start:${id}`;

  performance.mark(startMark);

  if (typeof window !== 'undefined') {
    window.__chartCurrentNav__ = {
      id,
      url,
      navigationType,
      startedAt: nowMs(),
      startMark,
    };
  }

  emitPerfEvent({
    type: 'route-start',
    name: 'route-transition-start',
    ts: Date.now(),
    url,
    detail: { id, navigationType },
  });
}
