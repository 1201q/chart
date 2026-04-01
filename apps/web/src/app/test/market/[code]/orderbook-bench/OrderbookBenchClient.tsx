'use client';

import { useRef, useState } from 'react';
import { MarketOrderbook } from '@chart/shared-types';
import TestProfiler from '@/components/profiler/TestProfiler';
import { LegacyOrderbook } from './LegacyOrderbook';
import { MemoOrderbook } from './MemoOrderbook';
import { CurrentOrderbook } from './CurrentOrderbook';

type Tab = 'A' | 'B' | 'C';

type ReplayEvent = { t: number; data: MarketOrderbook };

type Props = {
  code: string;
  initialSnapshot: MarketOrderbook;
  closePrice: number;
  initialTab?: Tab;
  sseUrl: string;
};

const TAB_LABELS: Record<Tab, string> = {
  A: 'A: Top-Down',
  B: 'B: Top-Down + memo',
  C: 'C: useSES + KeyedStore',
};

export default function OrderbookBenchClient({
  code,
  initialSnapshot,
  closePrice,
  initialTab = 'A',
  sseUrl,
}: Props) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [replayId, setReplayId] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);

  const recordingEsRef = useRef<EventSource | null>(null);
  const recordingRef = useRef<ReplayEvent[]>([]);
  const firstEventTimeRef = useRef<number | null>(null);

  const startRecording = () => {
    recordingRef.current = [];
    firstEventTimeRef.current = null;
    setReplayId(null);

    const encoded = encodeURIComponent(code);
    const url = `${process.env.NEXT_PUBLIC_API_URL}/sse/orderbook/${encoded}`;
    const es = new EventSource(url);

    es.addEventListener('realtime', (e) => {
      const now = performance.now();
      if (firstEventTimeRef.current === null) firstEventTimeRef.current = now;
      recordingRef.current.push({
        t: Math.round(now - firstEventTimeRef.current),
        data: JSON.parse(e.data) as MarketOrderbook,
      });
    });

    recordingEsRef.current = es;
    setRecording(true);
  };

  const stopRecording = () => {
    recordingEsRef.current?.close();
    recordingEsRef.current = null;
    setRecording(false);
  };

  const downloadRecording = () => {
    const blob = new Blob([JSON.stringify(recordingRef.current, null, 2)], {
      type: 'application/json',
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `orderbook-recording-${code}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const uploadRecording = async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sse/orderbook-replay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: recordingRef.current }),
    });
    const { id } = (await res.json()) as { id: string };
    setReplayId(id);
  };

  const hasRecording = recordingRef.current.length > 0;

  return (
    <div>
      {/* 탭 전환 */}
      <div style={{ display: 'flex', gap: 8, padding: 12 }}>
        {(['A', 'B', 'C'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '6px 16px',
              fontWeight: tab === t ? 'bold' : 'normal',
              textDecoration: tab === t ? 'underline' : 'none',
            }}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {/* SSE 녹화 컨트롤 */}
      <div
        style={{ display: 'flex', gap: 8, padding: '0 12px 12px', alignItems: 'center' }}
      >
        <button onClick={recording ? stopRecording : startRecording}>
          {recording ? '⏹ 녹화 중지' : '⏺ 녹화 시작'}
        </button>
        {hasRecording && !recording && (
          <>
            <button onClick={downloadRecording}>⬇ JSON 다운로드</button>
            <button onClick={uploadRecording}>⬆ BE 업로드</button>
          </>
        )}
        {replayId && (
          <span style={{ fontSize: 12, color: '#666' }}>
            재생 ID: <code>{replayId}</code>
            &nbsp;→&nbsp;
            <code>/sse/orderbook-replay/{replayId}</code>
          </span>
        )}
        {hasRecording && !recording && (
          <span style={{ fontSize: 12, color: '#888' }}>
            {recordingRef.current.length}개 이벤트 (
            {((recordingRef.current.at(-1)?.t ?? 0) / 1000).toFixed(1)}s)
          </span>
        )}
      </div>

      <TestProfiler
        key={tab}
        label={`orderbook-${tab}`}
        durationMs={20000}
        autoStart={false}
        autoScroll={false}
      >
        {tab === 'A' && (
          <LegacyOrderbook
            sseUrl={sseUrl}
            initialSnapshot={initialSnapshot}
            closePrice={closePrice}
          />
        )}
        {tab === 'B' && (
          <MemoOrderbook
            sseUrl={sseUrl}
            initialSnapshot={initialSnapshot}
            closePrice={closePrice}
          />
        )}
        {tab === 'C' && (
          <CurrentOrderbook
            sseUrl={sseUrl}
            initialSnapshot={initialSnapshot}
            closePrice={closePrice}
          />
        )}
      </TestProfiler>
    </div>
  );
}
