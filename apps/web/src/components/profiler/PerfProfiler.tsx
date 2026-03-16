'use client';

import { Profiler, type ProfilerOnRenderCallback } from 'react';
import { currentRoute, emitPerfEvent } from '@/utils/perf/log';

const onRender: ProfilerOnRenderCallback = (
  id,
  phase,
  actualDuration,
  baseDuration,
  startTime,
  commitTime,
) => {
  emitPerfEvent({
    type: 'react-profiler',
    name: id,
    ts: Date.now(),
    route: currentRoute(),
    duration: actualDuration,
    detail: {
      phase,
      baseDuration,
      startTime,
      commitTime,
    },
  });
};

export default function PerfProfiler({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  if (process.env.NEXT_PUBLIC_ENABLE_REACT_PROFILER !== '1') {
    return <>{children}</>;
  }

  return (
    <Profiler id={id} onRender={onRender}>
      {children}
    </Profiler>
  );
}
