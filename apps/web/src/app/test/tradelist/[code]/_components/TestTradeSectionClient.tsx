'use client';

import { useTrades } from '@/components/provider/NewTradeProvider';
import MarketTradeListItem from '@/components/tradeList/MarketTradeListItem';

export default function TestTradeSectionClient() {
  const trades = useTrades();

  return (
    <ul>
      {trades.map((t) => (
        <MarketTradeListItem key={t.id} trade={t} />
      ))}
    </ul>
  );
}
