import { MarketOrderbook as MarketOrderbookType } from '@chart/shared-types';
import OrderbookTestPage from './page';

// import MarketOrderbookList from './MarketOrderbookList';

async function fetchOrderbook(code: string): Promise<MarketOrderbookType> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orderbook/${code}`, {
    cache: 'no-store',
  });

  console.log(res);

  return res.json();
}

const MarketOrderbook = async ({ params }: { params: Promise<{ code: string }> }) => {
  const { code } = await params;
  const data = await fetchOrderbook(code);

  return <OrderbookTestPage initialSnapshot={data} code={'KRW-BTC'} />;
};

export default MarketOrderbook;
