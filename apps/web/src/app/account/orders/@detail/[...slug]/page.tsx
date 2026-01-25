import { TradingOrderDto } from '@chart/shared-types';

async function fetchOrders(): Promise<{
  ok: boolean;
  orders: TradingOrderDto[];
}> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders`, {
    cache: 'no-store',
  });

  return res.json();
}

const Page = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const orderId = await params;
  const { orders } = await fetchOrders(); // 임시

  const detail = orders.find((order) => order.id === orderId.slug[0]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        rowGap: '10px',
        backgroundColor: 'red',
      }}
    >
      {orderId.slug[0]}
    </div>
  );
};

export default Page;
