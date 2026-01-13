'use client';

import { useSortedTickerCodes } from '@/hooks/tickers.hooks';

import NewTickerItem from './NewTickerItem';

const NewTickerList = () => {
  const codes = useSortedTickerCodes();

  return (
    <ul>
      {codes.map((code) => (
        <NewTickerItem key={code} code={code} />
      ))}
    </ul>
  );
};

export default NewTickerList;
