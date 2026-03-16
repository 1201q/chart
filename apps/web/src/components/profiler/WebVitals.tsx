'use client';

import { useReportWebVitals } from 'next/web-vitals';
import { currentRoute, emitPerfEvent } from '@/utils/perf/log';

type ReportWebVitalsCallback = Parameters<typeof useReportWebVitals>[0];

const handleWebVitals: ReportWebVitalsCallback = (metric) => {
  emitPerfEvent({
    type: 'web-vital',
    name: metric.name,
    ts: Date.now(),
    route: currentRoute(),
    duration: typeof metric.value === 'number' ? metric.value : undefined,
    detail: {
      id: metric.id,
      label: metric.label,
      value: metric.value,
      rating: (metric as { rating?: string }).rating,
      navigationType: (metric as { navigationType?: string }).navigationType,
      attribution: (metric as { attribution?: unknown }).attribution,
    },
  });
};

export default function WebVitals() {
  useReportWebVitals(handleWebVitals);
  return null;
}
