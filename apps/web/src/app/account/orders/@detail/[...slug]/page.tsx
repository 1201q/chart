import AccountOrderDetail from '@/components/account/AccountOrderDetail';
import { getOrders } from '@/utils/api/orders.api';
import { getTickers } from '@/utils/api/ticker.api';

const Page = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const [orders, tickers] = await Promise.all([getOrders({}), getTickers()]);
  const orderId = await params;
  const detail = orders.find((order) => order.id === orderId.slug[0]);

  const market = detail?.market;
  const koreanName = market ? tickers[market]?.koreanName : '';

  if (!detail) return null;
  const { fills, ...orderWithoutFills } = detail;

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
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
