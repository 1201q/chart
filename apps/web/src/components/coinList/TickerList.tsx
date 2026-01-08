'use client';

import { useTickerCodes } from '@/utils/tickerStore';
import { useTicker } from '@/utils/tickerStore';

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
