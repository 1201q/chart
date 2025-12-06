'use client';

import { useTickerSse } from '@/hooks/useTickerSse';
import { useRenderMetric } from '@/utils/renderMetrics';

import { MarketTickerWithNames, MarketTickerWithNamesMap } from '@chart/shared-types';

const TickerClient = ({
  initialSnapshot,
}: {
  initialSnapshot: MarketTickerWithNamesMap;
}) => {
  useRenderMetric('A:CLIENT');
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

const TickerItem = ({ ticker }: { ticker: MarketTickerWithNames }) => {
  useRenderMetric(`A:ITEM:${ticker.code}`);
  return (
    <li>
      <span>{ticker.koreanName}</span>
      <span>{ticker.tradePrice}</span>/<span>{ticker.accTradePrice24h}</span>
    </li>
  );
};

export default TickerClient;
