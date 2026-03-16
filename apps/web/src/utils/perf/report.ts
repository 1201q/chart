import type { PerfEvent } from './log';

interface NavTiming {
  id: string;
  url: string;
  navigationType: string;
  startTs: number;
  duration: number | null;
}

interface SseTiming {
  key: string;
  url: string;
  name: string;
  duration: number;
  openCount?: number;
}

interface SuspenseTiming {
  name: string;
  duration: number;
  route: string | undefined;
}

function events(): PerfEvent[] {
  return (typeof window !== 'undefined' && window.__chartPerfEvents__) ? [...window.__chartPerfEvents__] : [];
}

function groupByType() {
  const groups: Record<string, { durations: number[]; count: number }> = {};

  for (const e of events()) {
    const key = `${e.type}:${e.name}`;
    if (!groups[key]) groups[key] = { durations: [], count: 0 };
    groups[key].count += 1;
    if (e.duration != null) groups[key].durations.push(e.duration);
  }

  return Object.entries(groups).map(([key, { durations, count }]) => {
    const sorted = [...durations].sort((a, b) => a - b);
    const avg = sorted.length ? sorted.reduce((s, v) => s + v, 0) / sorted.length : null;
    const p75 = sorted.length ? sorted[Math.floor(sorted.length * 0.75)] : null;
    return {
      event: key,
      count,
      'avg(ms)': avg != null ? +avg.toFixed(1) : '-',
      'p75(ms)': p75 != null ? +p75.toFixed(1) : '-',
      'min(ms)': sorted.length ? +sorted[0].toFixed(1) : '-',
      'max(ms)': sorted.length ? +sorted[sorted.length - 1].toFixed(1) : '-',
    };
  });
}

function navTimings(): NavTiming[] {
  const evts = events();
  const starts = evts.filter((e) => e.type === 'route-start');
  const commits = evts.filter((e) => e.type === 'route-commit');

  return starts.map((s) => {
    const id = (s.detail?.id as string) ?? '';
    const commit = commits.find((c) => (c.detail?.id as string) === id);
    return {
      id,
      url: s.url ?? s.detail?.url as string ?? '',
      navigationType: (s.detail?.navigationType as string) ?? '',
      startTs: s.ts,
      duration: commit?.duration ?? null,
    };
  });
}

function sseTimings(): SseTiming[] {
  return events()
    .filter((e) => e.type === 'sse')
    .map((e) => ({
      key: (e.detail?.key as string) ?? '',
      url: e.url ?? '',
      name: e.name,
      duration: e.duration ?? 0,
      openCount: e.detail?.openCount as number | undefined,
    }));
}

function suspenseTimings(): SuspenseTiming[] {
  return events()
    .filter((e) => e.type === 'suspense' && e.name.endsWith(':fallback-unmounted'))
    .map((e) => ({
      name: e.name.replace(':fallback-unmounted', ''),
      duration: e.duration ?? 0,
      route: e.route,
    }));
}

if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).__chartPerf = {
    events,
    report() {
      console.table(groupByType());
    },
    navTimings() {
      console.table(navTimings());
    },
    sseTimings() {
      console.table(sseTimings());
    },
    suspenseTimings() {
      console.table(suspenseTimings());
    },
    clear() {
      window.__chartPerfEvents__ = [];
      console.info('[chart:perf] cleared');
    },
  };
}
