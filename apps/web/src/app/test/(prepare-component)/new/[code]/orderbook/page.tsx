'use client';

import MarketOrderbookList from '@/components/orderbook/new/NewMarketOrderbookList';
import OrderbookProfiler from './Profiler';

const OrderbookTestPage = () => {
  return (
    <OrderbookProfiler label="orderbook-new" durationMs={10_000} autoStart={false}>
      <MarketOrderbookList code={'KRW-BTC'} />;
    </OrderbookProfiler>
  );
};

export default OrderbookTestPage;
