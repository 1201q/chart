'use client';

import { useTickerSse } from '@/hooks/useTickerSse';
import { useRenderMetric } from '@/utils/renderMetrics';

import { MarketTickerWithNames, MarketTickerWithNamesMap } from '@chart/shared-types';
import React from 'react';

const TickerClientMemo = ({
  initialSnapshot,
}: {
  initialSnapshot: MarketTickerWithNamesMap;
}) => {
  useRenderMetric('B:CLIENT');
  const { connected, tickers } = useTickerSse(initialSnapshot);
  return (
    <div>
      <p>SSE 연결 상태: {connected ? '연결됨' : '연결 안 됨'}</p>
      <ul>
        {tickers.map((t) => (
          <TickerItem key={t.code} ticker={t} />
        ))}
      </ul>
    </div>
  );
};

const TickerItem = React.memo(({ ticker }: { ticker: MarketTickerWithNames }) => {
  useRenderMetric(`B:ITEM:${ticker.code}`);
  return (
    <li>
      <span>{ticker.koreanName}</span>
      <span>{ticker.tradePrice}</span>/<span>{ticker.accTradePrice24h}</span>
    </li>
  );
});

TickerItem.displayName = 'TickerItem';

export default React.memo(TickerClientMemo);
