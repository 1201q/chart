'use client';

import MarketOrderbookList from '@/components/orderbook/MarketOrderbookList';
import { MarketOrderbook } from '@chart/shared-types';
import OrderbookProfiler from './Profiler';

const OrderbookTestPage = ({
  initialSnapshot,
  code,
}: {
  initialSnapshot: MarketOrderbook;
  code: string;
}) => {
  return (
    <OrderbookProfiler label="orderbook-prev" durationMs={10_000} autoStart={false}>
      <MarketOrderbookList initialSnapshot={initialSnapshot} code={code} />;
    </OrderbookProfiler>
  );
};

export default OrderbookTestPage;
