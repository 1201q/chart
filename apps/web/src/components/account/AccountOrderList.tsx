import {
  MarketTickerWithNamesMap,
  TradingFillDto,
  TradingOrderDto,
} from '@chart/shared-types';
import styles from './styles/account.order.item.module.css';
import AccountOrderItem from './AccountOrderItem';

interface AccountOrderListProps {
  data: (TradingOrderDto & { fills: TradingFillDto[] })[];
  snapshot: MarketTickerWithNamesMap;
  selectedId?: string;
}

function dateKey(ts: Date | string) {
  const d = typeof ts === 'string' ? new Date(ts) : ts;

  return d.toISOString().split('T')[0];
}

function timeKey(o: TradingOrderDto) {
  return typeof o.createdAt === 'string'
    ? Date.parse(o.createdAt)
    : o.createdAt.getTime();
}

const AccountOrderList = ({ data, snapshot, selectedId }: AccountOrderListProps) => {
  const items = data
    .filter((o) => o.status !== 'OPEN')
    .sort((a, b) => timeKey(b) - timeKey(a))
    .map((o, idx, arr) => {
      const currentKey = dateKey(o.createdAt);

      const prev = arr[idx - 1];
      const prevKey = prev ? dateKey(prev.createdAt) : null;

      const showDate = idx === 0 || currentKey !== prevKey;

      return { order: o, showDate };
    });

  return (
    <div className={styles.orders}>
      {items.map((d) => {
        const { fills, ...orderWithoutFills } = d.order;
        return (
          <AccountOrderItem
            key={d.order.id}
            order={orderWithoutFills}
            fills={fills}
            showDate={d.showDate}
            koreanName={snapshot[d.order.market]?.koreanName}
            selected={selectedId === d.order.id}
          />
        );
      })}
    </div>
  );
};

export default AccountOrderList;
