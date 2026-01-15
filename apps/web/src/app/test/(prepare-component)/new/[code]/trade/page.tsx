'use client';

import TradeProfiler from './Profiler';
import MarketTradeList from '@/components/tradeList/new/NewMarketTradeList';

const TradeTestPage = () => {
  return (
    <TradeProfiler label="trade-new" durationMs={10_000} autoStart={false}>
      <MarketTradeList />
    </TradeProfiler>
  );
};

export default TradeTestPage;
