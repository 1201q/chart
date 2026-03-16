'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { emitPerfEvent, nowMs } from '@/utils/perf/log';

export default function RoutePerfTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFirstRender = useRef(true);

  useEffect(() => {
    const route = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;

    if (isFirstRender.current) {
      isFirstRender.current = false;

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          emitPerfEvent({
            type: 'route-commit',
            name: 'initial-route-visible',
            ts: Date.now(),
            route,
          });
        });
      });

      return;
    }

    const nav = typeof window !== 'undefined' ? window.__chartCurrentNav__ : undefined;
    if (!nav) return;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const duration = nowMs() - nav.startedAt;

        try {
          performance.measure(`chart-nav-commit:${nav.id}`, nav.startMark);
        } catch {
          // mark가 없으면 무시
        }

        emitPerfEvent({
          type: 'route-commit',
          name: 'route-transition-commit',
          ts: Date.now(),
          route,
          url: nav.url,
          duration,
          detail: {
            id: nav.id,
            navigationType: nav.navigationType,
          },
        });

        if (typeof window !== 'undefined') {
          window.__chartCurrentNav__ = undefined;
        }
      });
    });
  }, [pathname, searchParams]);

  return null;
}
