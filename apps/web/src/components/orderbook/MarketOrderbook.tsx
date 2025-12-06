import { MarketOrderbook as MarketOrderbookType } from '@chart/shared-types';

import MarketOrderbookList from './MarketOrderbookList';

async function fetchOrderbook(code: string): Promise<MarketOrderbookType> {
  const res = await fetch(`http://localhost:8000/orderbook/${code}`, {
    cache: 'no-store',
  });
  return res.json();
}

const MarketOrderbook = async ({ code }: { code: string }) => {
  const data = await fetchOrderbook(code);

  return <MarketOrderbookList initialSnapshot={data} code={code} />;
};

export default MarketOrderbook;
