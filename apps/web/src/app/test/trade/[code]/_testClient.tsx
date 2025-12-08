'use client';

import type { MarketTradeWithId } from '@chart/shared-types';
import { useTradeSse } from '@/hooks/useTradeSse';
import { useTradeListSseStream } from '@/hooks/useTradeListSseStream';
import { useTrades } from '@/hooks/useTrades';
import styles from './trade-bench.module.css';
import MarketTradeListItem from '@/components/tradeList/MarketTradeListItem';
import MarketTradeListItemV2 from '@/components/tradeList/MarketTradeListItemV2';

import { Profiler, ProfilerOnRenderCallback } from 'react';

interface Props {
  code: string;
  initialSnapshot: MarketTradeWithId[];
}

type OnRenderCallback = ProfilerOnRenderCallback;

export function TradeBenchClient({ code, initialSnapshot }: Props) {
  function onRender(id, phase, actualDuration, baseDuration, startTime, commitTime) {
    console.log(
      `[Profiler][${id}] ${phase} - actualDuration: ${actualDuration.toFixed(2)}ms`,
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.column}>
        <h2>Legacy: useTradeSse (local state)</h2>
        <Profiler id="🧱LegacyTradeList🧱" onRender={onRender}>
          <LegacyTradeList code={code} initialSnapshot={initialSnapshot} />
        </Profiler>
      </div>

      <div className={styles.column}>
        <h2>Store: tradeStore + useSyncExternalStore</h2>
        <Profiler id="🔥storeTradeList🔥" onRender={onRender}>
          <StoreTradeList code={code} initialSnapshot={initialSnapshot} />
        </Profiler>
      </div>
      {/* 
      <div className={styles.column}>
        <h2>Store: tradeStore + itemV2</h2>
        <StoreTradeListItemV2 code={code} initialSnapshot={initialSnapshot} />
      </div> */}
    </div>
  );
}

/** A 안: 예전 useTradeSse 훅 버전 */
function LegacyTradeList({
  code,
  initialSnapshot,
}: {
  code: string;
  initialSnapshot: MarketTradeWithId[];
}) {
  const { trades } = useTradeSse(code, initialSnapshot);

  if (trades.length === 0) return <div>no trades</div>;

  return (
    <ul className={styles.list}>
      {trades.map((t, idx) => (
        <MarketTradeListItem key={`a-${idx}`} trade={t} />
      ))}
    </ul>
  );
}

/** B 안: external store + useSyncExternalStore 버전 */
function StoreTradeList({
  code,
  initialSnapshot,
}: {
  code: string;
  initialSnapshot: MarketTradeWithId[];
}) {
  // 스토어에 초기 스냅샷 + SSE 연결
  useTradeListSseStream(code, initialSnapshot);

  const trades = useTrades();

  if (trades.length === 0) return <div>no trades</div>;

  return (
    <ul className={styles.list}>
      {trades.map((t, idx) => (
        <MarketTradeListItem
          key={`b-${t.sequentialId}-${t.tradePrice}-${t.tradeVolume}-${idx}`}
          trade={t}
        />
      ))}
    </ul>
  );
}

/** C 안: external store + useSyncExternalStore + item V2버전 */
function StoreTradeListItemV2({
  code,
  initialSnapshot,
}: {
  code: string;
  initialSnapshot: MarketTradeWithId[];
}) {
  // 스토어에 초기 스냅샷 + SSE 연결
  useTradeListSseStream(code, initialSnapshot);

  const trades = useTrades();

  if (trades.length === 0) return <div>no trades</div>;

  return (
    <ul className={styles.list}>
      {trades.map((t, idx) => (
        <MarketTradeListItemV2
          key={`c-${t.sequentialId}-${t.tradePrice}-${t.tradeVolume}-${idx}`}
          tradePrice={t.tradePrice}
          tradeVolume={t.tradeVolume}
          tradeTimestamp={t.tradeTimestamp}
          askBid={t.askBid}
          change={t.change}
        />
      ))}
    </ul>
  );
}
