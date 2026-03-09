/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { Profiler, useEffect, useMemo, useRef, useState } from 'react';

type ProfilerEntry = {
  phase: 'mount' | 'update' | 'nested-update';
  actualDuration: number;
  baseDuration: number;
  startTime: number;
  commitTime: number;
};

type LongTaskEntry = {
  startTime: number;
  duration: number;
  name: string;
};

type FpsSample = {
  t: number;
  fps: number;
};

type PerfResult = {
  label: string;
  startedAt: number;
  endedAt: number;
  profiler: ProfilerEntry[];
  longTasks: LongTaskEntry[];
  fps: FpsSample[];
  memory?: { t: number; usedJSHeapSize: number }[];
};

function percentile(sorted: number[], p: number) {
  if (sorted.length === 0) return 0;
  const idx = Math.min(
    sorted.length - 1,
    Math.max(0, Math.floor((sorted.length - 1) * p)),
  );
  return sorted[idx];
}

function summarizeProfiler(entries: ProfilerEntry[]) {
  const updates = entries
    .filter((e) => e.phase === 'update')
    .map((e) => e.actualDuration);
  const mounts = entries.filter((e) => e.phase === 'mount').map((e) => e.actualDuration);

  const s = (arr: number[]) => {
    const a = [...arr].sort((x, y) => x - y);
    const sum = a.reduce((acc, v) => acc + v, 0);
    return {
      n: a.length,
      avg: a.length ? sum / a.length : 0,
      max: a.length ? a[a.length - 1] : 0,
      p50: percentile(a, 0.5),
      p95: percentile(a, 0.95),
      p99: percentile(a, 0.99),
    };
  };

  return { mounts: s(mounts), updates: s(updates) };
}

function summarizeLongTasks(entries: LongTaskEntry[]) {
  const total = entries.reduce((acc, e) => acc + e.duration, 0);
  const max = entries.reduce((acc, e) => Math.max(acc, e.duration), 0);
  return { count: entries.length, totalMs: total, maxMs: max };
}

function summarizeFps(samples: FpsSample[]) {
  const vals = samples.map((s) => s.fps);
  const a = [...vals].sort((x, y) => x - y);
  const sum = a.reduce((acc, v) => acc + v, 0);
  return {
    n: a.length,
    avg: a.length ? sum / a.length : 0,
    min: a.length ? a[0] : 0,
    p50: percentile(a, 0.5),
    p05: percentile(a, 0.05),
  };
}

type TestProfilerProps = {
  label: string;
  durationMs?: number;
  autoStart?: boolean;
  autoScroll?: boolean;
  children: React.ReactNode;
};

export default function TestProfiler({
  label,
  durationMs = 10_000,
  autoStart = true,
  autoScroll = false,
  children,
}: TestProfilerProps) {
  const startedAtRef = useRef(0);
  const endedAtRef = useRef(0);

  const profilerRef = useRef<ProfilerEntry[]>([]);
  const longTaskRef = useRef<LongTaskEntry[]>([]);
  const fpsRef = useRef<FpsSample[]>([]);
  const memoryRef = useRef<{ t: number; usedJSHeapSize: number }[]>([]);

  const rafIdRef = useRef<number | null>(null);
  const fpsStateRef = useRef({ frames: 0, lastSecT: 0 });

  const longTaskObsRef = useRef<PerformanceObserver | null>(null);
  const memTimerRef = useRef<number | null>(null);

  const runningRef = useRef(false);
  const timeoutRef = useRef<number | null>(null);

  const [running, setRunning] = useState(false);
  const [summary, setSummary] = useState<any>(null);

  const download = (result: PerfResult) => {
    const blob = new Blob([JSON.stringify(result, null, 2)], {
      type: 'application/json',
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${label}-${new Date().toISOString().replaceAll(':', '-')}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const stop = () => {
    if (!runningRef.current) return;
    runningRef.current = false;
    setRunning(false);
    endedAtRef.current = performance.now();

    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    rafIdRef.current = null;

    longTaskObsRef.current?.disconnect();
    longTaskObsRef.current = null;

    if (memTimerRef.current) window.clearInterval(memTimerRef.current);
    memTimerRef.current = null;

    const result: PerfResult = {
      label,
      startedAt: startedAtRef.current,
      endedAt: endedAtRef.current,
      profiler: profilerRef.current,
      longTasks: longTaskRef.current,
      fps: fpsRef.current,
      memory: memoryRef.current.length ? memoryRef.current : undefined,
    };

    const nextSummary = {
      label,
      durationMs: endedAtRef.current - startedAtRef.current,
      profiler: summarizeProfiler(result.profiler),
      longTasks: summarizeLongTasks(result.longTasks),
      fps: summarizeFps(result.fps),
      memoryLast:
        result.memory && result.memory.length
          ? result.memory[result.memory.length - 1].usedJSHeapSize
          : undefined,
      coinListChanged: (window as any).__LIST_CODES_CHANGED__ || 0,
    };

    setSummary(nextSummary);

    (window as any).__TEST_PROFILER__ = {
      result,
      summary: nextSummary,
      download: () => download(result),
    };
  };

  const start = () => {
    if (runningRef.current) return;

    runningRef.current = true;
    setRunning(true);
    setSummary(null);

    (window as any).__LIST_CODES_CHANGED__ = 0;

    if (autoScroll) {
      const scroller = document.querySelector('[data-coinlist-scroll]') as HTMLDivElement;
      if (scroller) {
        scroller.scrollTop = 0;
        let t = 0;
        const id = window.setInterval(() => {
          t += 30;
          scroller.scrollTop = t;
        }, 16);
        window.setTimeout(() => window.clearInterval(id), 6000);
      }
    }

    profilerRef.current = [];
    longTaskRef.current = [];
    fpsRef.current = [];
    memoryRef.current = [];

    const t0 = performance.now();
    startedAtRef.current = t0;
    endedAtRef.current = 0;

    try {
      const obs = new PerformanceObserver((list) => {
        for (const e of list.getEntries()) {
          longTaskRef.current.push({
            startTime: e.startTime,
            duration: (e as any).duration ?? 0,
            name: e.name ?? 'longtask',
          });
        }
      });
      obs.observe({ entryTypes: ['longtask'] });
      longTaskObsRef.current = obs;
    } catch {}

    fpsStateRef.current = { frames: 0, lastSecT: t0 };
    const loop = (t: number) => {
      fpsStateRef.current.frames += 1;
      const delta = t - fpsStateRef.current.lastSecT;
      if (delta >= 1000) {
        const fps = Math.round((fpsStateRef.current.frames * 1000) / delta);
        fpsRef.current.push({ t: t - t0, fps });
        fpsStateRef.current.frames = 0;
        fpsStateRef.current.lastSecT = t;
      }
      rafIdRef.current = requestAnimationFrame(loop);
    };
    rafIdRef.current = requestAnimationFrame(loop);

    const perfAny = performance as any;
    if (perfAny?.memory?.usedJSHeapSize != null) {
      memTimerRef.current = window.setInterval(() => {
        memoryRef.current.push({
          t: performance.now() - t0,
          usedJSHeapSize: perfAny.memory.usedJSHeapSize,
        });
      }, 500);
    }

    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(stop, durationMs);
  };

  useEffect(() => {
    if (autoStart) start();
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRender = useMemo(
    () =>
      function onRender(
        _id: string,
        phase: 'mount' | 'update' | 'nested-update',
        actualDuration: number,
        baseDuration: number,
        startTime: number,
        commitTime: number,
      ) {
        if (!runningRef.current) return;
        profilerRef.current.push({
          phase,
          actualDuration,
          baseDuration,
          startTime,
          commitTime,
        });
      },
    [],
  );

  return (
    <>
      <div
        style={{
          position: 'fixed',
          backgroundColor: 'red',
          right: 12,
          bottom: 12,
          zIndex: 9999,
        }}
      >
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={start} disabled={running}>
            start
          </button>
          <button onClick={stop} disabled={!running}>
            stop
          </button>
          <button
            onClick={() => (window as any).__TEST_PROFILER__?.download?.()}
            disabled={!summary}
          >
            download
          </button>
        </div>
        {summary && (
          <pre style={{ marginTop: 8, background: '#fff', padding: 8, maxWidth: 360 }}>
            {JSON.stringify(summary, null, 2)}
          </pre>
        )}
      </div>

      <Profiler id={label} onRender={onRender}>
        {children}
      </Profiler>
    </>
  );
}
