import {
  MarketTickerWithNamesMap,
  TradingFillDto,
  TradingOrderDto,
} from '@chart/shared-types';
import styles from './styles/account.order.detail.module.css';

interface AccountOrderDetailProps {
  fills: TradingFillDto[];
  order: TradingOrderDto;
  koreanName: string;
}

function timeKey(o: TradingOrderDto) {
  return typeof o.createdAt === 'string'
    ? Date.parse(o.createdAt)
    : o.createdAt.getTime();
}

const AccountOrderDetail = ({ order, fills, koreanName }: AccountOrderDetailProps) => {
  const canceled = order.status === 'CANCELED';

  const orderSide = () => {
    const side = order.side;
    const status = order.status;

    const partialFilled = Number(order.filledQty) > 0;

    if (status === 'FILLED') {
      return side === 'BUY' ? '매수완료' : '매도완료';
    } else {
      if (partialFilled) {
        return side === 'BUY' ? '매수일부체결' : '매도일부체결';
      }

      return side === 'BUY' ? '매수취소' : '매도취소';
    }
  };

  console.log(order);

  return (
    <div className={styles.detail}>
      <div className={styles.topWrapper}>
        <span className={styles.koreanName}>{koreanName}</span>
        <span className={styles.side}>{orderSide()}</span>
      </div>
      <div className={styles.infoRows}>
        <div className={styles.infoRow}>
          <span className={styles.label}>주문 시간</span>
          <span className={styles.value}>
            {new Date(order.createdAt).toLocaleString('ko-KR', {
              dateStyle: 'long',
              timeStyle: 'short',
            })}
          </span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.label}>체결완료 시간</span>
          <span className={styles.value}>
            {new Date(order.filledAt).toLocaleString('ko-KR', {
              dateStyle: 'long',
              timeStyle: 'short',
            })}
          </span>
        </div>

        <div className={styles.infoRow}>
          <span className={styles.label}>주문 유형</span>
          <span className={styles.value}>
            {order.type === 'LIMIT' ? '지정가' : '시장가'}
          </span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.label}>{order.market.replace('KRW-', '')} 당 가격</span>
          <span className={styles.value}>{order.price}</span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.label}>주문 수량</span>
          <span className={styles.value}>{order.qty}</span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.label}>11</span>
          <span className={styles.value}>11111111</span>
        </div>
      </div>
    </div>
  );
};

export default AccountOrderDetail;
