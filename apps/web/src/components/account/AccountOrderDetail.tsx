import { TradingFillDto, TradingOrderDto } from '@chart/shared-types';
import styles from './styles/account.order.detail.module.css';
import { createKrwPriceFormatter } from '@/utils/formatting/price';
import { FillMetrics } from '@/utils/stores/new/FillsStore';
import Image from 'next/image';

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

  const priceFormatter = createKrwPriceFormatter(Number(order.price));

  const imgSrc = `${process.env.NEXT_PUBLIC_API_URL?.replace('/mock', '')}/markets/icon/${order.market.replace('KRW-', '').toUpperCase()}`;

  return (
    <div className={styles.detail}>
      <div className={styles.topWrapper}>
        <div className={styles.texts}>
          <span className={styles.koreanName}>{koreanName}</span>
          <span className={styles.side}>{orderSide()}</span>
        </div>
        <div>
          <Image src={imgSrc} alt="" width={29} height={29} />
        </div>
      </div>
      {/* 체결 정보=========== */}
      {fills.length > 0 && metrics.filledQty > 0 && (
        <div className={styles.infoRows}>
          {/* 1개당 가격 */}
          <div className={styles.infoRow}>
            <span className={styles.label}>체결 가격</span>
            <span className={styles.value}>
              {priceFormatter.formatPrice(Number(metrics.filledAvgPrice))}원
            </span>
          </div>
          {/* 1개당 가격 */}
          <div className={styles.infoRow}>
            <span className={styles.label}>체결 수량</span>
            <span className={styles.value}>
              {Number(metrics.filledQty).toLocaleString('ko-KR', {
                maximumFractionDigits: 8,
              })}
            </span>
          </div>
          <div className={styles.divider}></div>
          {/* 주문 수량 */}
          <div className={styles.infoRow}>
            <span className={styles.label}>체결 금액</span>
            <span className={styles.value}>
              {Number(metrics.filledSum).toLocaleString('ko-KR', {
                maximumFractionDigits: 0,
              })}
              원
            </span>
          </div>
        </div>
      )}
      {/* 추가 정보 ============== */}
      <div className={styles.infoRows}>
        <h3>주문 정보</h3>

        {/* 주문 유형 */}
        <div className={styles.infoRow}>
          <span className={styles.label}>주문 유형</span>
          <span className={styles.value}>
            {order.type === 'LIMIT' ? '지정가' : '시장가'}
          </span>
        </div>
        {/* 1개당 가격 */}
        <div className={styles.infoRow}>
          <span className={styles.label}>{order.market.replace('KRW-', '')} 당 가격</span>
          <span className={styles.value}>
            {priceFormatter.formatPrice(Number(order.price))}원
          </span>
        </div>
        {/* 주문 수량 */}
        <div className={styles.infoRow}>
          <span className={styles.label}>주문 수량</span>
          <span className={styles.value}>
            {Number(order.qty).toLocaleString('ko-KR', {
              maximumFractionDigits: 8,
            })}
          </span>
        </div>
        {/* 주문 시간 */}
        <div className={styles.infoRow}>
          <span className={styles.label}>주문 시간</span>
          <span className={styles.value}>
            {new Date(order.createdAt).toLocaleString('ko-KR', {
              dateStyle: 'long',
              timeStyle: 'short',
            })}
          </span>
        </div>
        {/* 체결 시간 */}
        <div className={styles.infoRow}>
          {canceled ? (
            <>
              <span className={styles.label}>취소 시간</span>
              <span className={styles.value}>
                {new Date(order.canceledAt).toLocaleString('ko-KR', {
                  dateStyle: 'long',
                  timeStyle: 'short',
                })}
              </span>
            </>
          ) : (
            <>
              <span className={styles.label}>체결완료 시간</span>
              <span className={styles.value}>
                {new Date(order.filledAt).toLocaleString('ko-KR', {
                  dateStyle: 'long',
                  timeStyle: 'short',
                })}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountOrderDetail;
