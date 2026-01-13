'use client';

import { useTickerCodes } from '@/utils/stores/ticker.store';
import { useTicker } from '@/utils/stores/ticker.store';

import TickerItem from './TickerItem';

const TickerList = () => {
  const codes = useTickerCodes();

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

export default TickerList;
