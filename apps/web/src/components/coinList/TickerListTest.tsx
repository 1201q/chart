'use client';

import { useTicker } from '@/hooks/useTicker';
import { useTickerSse2 } from '@/hooks/useTickerSse2';

import { MarketTickerWithNamesMap } from '@chart/shared-types';
import { useMemo } from 'react';
import TickerItem from './TickerItem';

const TickerListTest = ({
  initialSnapshot,
}: {
  initialSnapshot: MarketTickerWithNamesMap;
}) => {
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
    <>
      {codes.map((code) => (
        <TickerListItem key={code} code={code} />
      ))}
    </>
  );
};

const TickerListItem = ({ code }: { code: string }) => {
  const ticker = useTicker(code);
  if (!ticker) return null;

  return <TickerItem ticker={ticker} />;
};

export default TickerListTest;
