'use client';

import { useEffect, useState } from 'react';
import styles from './page.module.css';

type TestEvent = {
  seq: number;
  time: string;
};

export default function Home() {
  const [connected, setConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<TestEvent | null>(null);
  const [log, setLog] = useState<TestEvent[]>([]);

  useEffect(() => {
    // Nest API 주소
    const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
    const url = `${baseUrl}/sse/ticker/KRW-DOGE`;

    const es = new EventSource(url);

    es.onopen = () => {
      console.log('SSE connected');
      setConnected(true);
    };

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as TestEvent;
        setLastEvent(data);
        setLog((prev) => [...prev.slice(-19), data]); // 최근 20개만 유지
      } catch (e) {
        console.error('Failed to parse SSE data', e);
      }
    };

    es.onerror = (err) => {
      console.error('SSE error', err);
      setConnected(false);
      // 필요하면 자동 재연결 로직 추가
      // es.close();
    };

    return () => {
      es.close();
    };
  }, []);

  return (
    <div className={styles.page}>
      <h1>SSE Test</h1>

      <p>
        연결상태:{' '}
        <span style={{ color: connected ? 'limegreen' : 'tomato' }}>
          {connected ? 'CONNECTED' : 'DISCONNECTED'}
        </span>
      </p>

      <section style={{ marginTop: 16 }}>
        <h2>마지막 이벤트</h2>
        {lastEvent ? (
          <pre>{JSON.stringify(lastEvent, null, 2)}</pre>
        ) : (
          <p>아직 이벤트 없음</p>
        )}
      </section>

      <section style={{ marginTop: 16 }}>
        <h2>이벤트 로그 (최근 20개)</h2>
        <div
          style={{
            border: '1px solid #ddd',
            borderRadius: 8,
            padding: 12,
            maxHeight: 300,
            overflowY: 'auto',
            fontFamily: 'monospace',
            fontSize: 12,
          }}
        >
          {log.map((item) => (
            <div key={item.seq}>
              #{item.seq} - {item.time}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
