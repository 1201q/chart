'use client';

import TradeProfiler from './Profiler';
import MarketTradeList from '@/components/tradeList/MarketTradeList';

const TradeTestPage = () => {
  return (
    <TradeProfiler label="trade-prev" durationMs={10_000} autoStart={false}>
      <MarketTradeList />
    </TradeProfiler>
  );
};

export default TradeTestPage;
