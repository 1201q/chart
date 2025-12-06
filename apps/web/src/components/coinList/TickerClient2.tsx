'use client';

import { useTicker } from '@/hooks/useTicker';
import { useTickerSse2 } from '@/hooks/useTickerSse2';
import { useRenderMetric } from '@/utils/renderMetrics';
import { MarketTickerWithNamesMap } from '@chart/shared-types';
import { useMemo } from 'react';
import TickerItem from './TickerItem';

const TickerClient2 = ({
  initialSnapshot,
}: {
  initialSnapshot: MarketTickerWithNamesMap;
}) => {
  useRenderMetric('C:CLIENT');

  const { connected } = useTickerSse2(initialSnapshot);
  const codes = useMemo(
    () =>
      Object.keys(initialSnapshot).sort(
        (a, b) =>
          initialSnapshot[b].accTradePrice24h - initialSnapshot[a].accTradePrice24h,
      ),
    [initialSnapshot],
  );
  return (
    <div>
      <p>SSE 연결 상태: {connected ? '연결됨' : '연결 안 됨'}</p>
      <ul>
        {codes.map((code) => (
          <TickerListItem key={code} code={code} />
        ))}
      </ul>
    </div>
  );
};

const TickerListItem = ({ code }: { code: string }) => {
  useRenderMetric(`C:ITEM:${code}`);

  const ticker = useTicker(code);
  if (!ticker) return null;

  return <TickerItem ticker={ticker} />;
};

export default TickerClient2;
