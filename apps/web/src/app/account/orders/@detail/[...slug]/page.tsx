import AccountOrderDetail from '@/components/account/AccountOrderDetail';
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

const Page = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const orderId = await params;
  const { orders } = await fetchOrders(); // 임시
  const snapshot = await fetchSnapshot(); // 임시

  const detail = orders.find((order) => order.id === orderId.slug[0]);

  const market = detail?.market;

  const koreanName = market ? snapshot[market]?.koreanName : '';

  if (!detail) return null;
  const { fills, ...orderWithoutFills } = detail;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        rowGap: '10px',
        position: 'relative',
      }}
    >
      <AccountOrderDetail
        order={orderWithoutFills}
        fills={fills}
        koreanName={koreanName}
      />
    </div>
  );
};

export default Page;
