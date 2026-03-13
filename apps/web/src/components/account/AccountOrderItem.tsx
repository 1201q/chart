import { TradingFillDto, TradingOrderDto } from '@chart/shared-types';
import styles from './styles/account.order.item.module.css';
import { FillMetrics } from '@/utils/stores/new/FillsStore';

interface AccountOrderItemProps {
  order: TradingOrderDto;
  fills: TradingFillDto[];
  showDate: boolean;
  koreanName: string;
  selected: boolean;
  onClick: () => void;
}

const AccountOrderItem = ({
  order,
  fills,
  showDate,
  koreanName,
  selected,
  onClick,
}: AccountOrderItemProps) => {
  const metrics = fills.reduce<FillMetrics>(
    (prev, fill) => {
      const qty = Number(fill.qty);
      const price = Number(fill.price);

      const filledQty = prev.filledQty + qty;
      const filledSum = prev.filledSum + price * qty;
      const filledAvgPrice = filledQty > 0 ? filledSum / filledQty : 0;

      const next: FillMetrics = {
        filledQty,
        filledSum,
        filledAvgPrice,
        filledCount: prev.filledCount + 1,
      };

      return next;
    },
    { filledQty: 0, filledSum: 0, filledAvgPrice: 0, filledCount: 0 },
  );

  const displayQty = Number(order.filledQty) > 0;
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

  return (
    <button
      onClick={onClick}
      className={`${styles.orderItem} ${canceled ? styles.canceled : ''} ${selected ? styles.selected : ''}`}
    >
      <div className={`${styles.leftWrapper}`}>
        <span className={styles.date}>
          {showDate
            ? new Date(order.createdAt)
                .toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })
                .replace(/\. /g, '.')
                .replace(/\.$/, '')
            : ' '}
        </span>

        <div className={styles.leftInfos}>
          <span className={styles.koreanName}>{koreanName}</span>
          <div className={styles.leftBottomInfo}>
            <span
              className={`${styles.tradeType} ${order.side === 'BUY' ? styles.rise : styles.fall}`}
            >
              {orderSide()}
            </span>
            {displayQty && (
              <>
                <span className={styles.dot}>·</span>
                <span
                  className={`${styles.qty} ${order.side === 'BUY' ? styles.rise : styles.fall}`}
                >
                  {Number(order.filledQty).toLocaleString('ko-KR', {
                    maximumFractionDigits: 6,
                  })}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
      {order.status === 'FILLED' && (
        <div className={styles.rightWrapper}>
          <span>
            {metrics.filledSum.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}원
          </span>
        </div>
      )}
    </button>
  );
};

export default AccountOrderItem;
