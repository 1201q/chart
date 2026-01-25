import AccountOrderList from '@/components/account/AccountOrderList';
import {
  MarketTickerWithNamesMap,
  TradingFillDto,
  TradingOrderDto,
} from '@chart/shared-types';

async function fetchOrders(): Promise<{
  ok: boolean;
  orders: (TradingOrderDto & { fills: TradingFillDto[] })[];
}> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders`, {
    cache: 'no-store',
  });

  return res.json();
}

async function fetchSnapshot(): Promise<MarketTickerWithNamesMap> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tickers/snapshot`, {
    cache: 'no-store',
  });

  return res.json();
}

const Page = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const { orders } = await fetchOrders();
  const snapshot = await fetchSnapshot();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', rowGap: '10px' }}>
      <AccountOrderList data={orders} snapshot={snapshot} selectedId={id} />
    </div>
  );
};

export default Page;
