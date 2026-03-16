'use client';

import { useEffect, useRef } from 'react';
import { currentRoute, emitPerfEvent, nowMs } from '@/utils/perf/log';

export default function SuspenseMark({
  name,
  children,
}: {
  name: string;
  children: React.ReactNode;
}) {
  const startedAt = useRef(0);

  useEffect(() => {
    startedAt.current = nowMs();

    emitPerfEvent({
      type: 'suspense',
      name: `${name}:fallback-mounted`,
      ts: Date.now(),
      route: currentRoute(),
    });

    return () => {
      emitPerfEvent({
        type: 'suspense',
        name: `${name}:fallback-unmounted`,
        ts: Date.now(),
        route: currentRoute(),
        duration: nowMs() - startedAt.current,
      });
    };
  }, [name]);

  return <>{children}</>;
}
