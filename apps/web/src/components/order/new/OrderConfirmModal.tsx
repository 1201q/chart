'use client';

import { useEffect } from 'react';
import { OrderSide } from '@chart/shared-types';
import styles from '../styles/order.confirm.module.css';

interface Props {
  code: string;
  side: OrderSide;
  price: number;
  qty: number;
  total: number;
  isLoading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const OrderConfirmModal = ({ code, side, price, qty, total, isLoading, onClose, onConfirm }: Props) => {
  const coinSymbol = code.split('-')[1] ?? code;
  const isBuy = side === 'BUY';
  const actionLabel = isBuy ? '구매' : '판매';

  const priceDisplay = price.toLocaleString('ko-KR', { maximumFractionDigits: 8 });
  const qtyDisplay = Number(qty.toFixed(8)).toLocaleString('ko-KR', { maximumFractionDigits: 8 });
  const totalDisplay = total.toLocaleString('ko-KR', { maximumFractionDigits: 0 });

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleBgClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className={styles.overlay} onClick={handleBgClick}>
      <div className={styles.sheet}>
        <div className={styles.handle} />

        <p className={styles.coinName}>{coinSymbol}</p>
        <p className={styles.heading}>
          {qtyDisplay}개{' '}
          <span className={isBuy ? styles.headingBuy : styles.headingSell}>{actionLabel}</span>
        </p>

        <ul className={styles.rows}>
          <li className={styles.row}>
            <span className={styles.rowLabel}>주문 유형</span>
            <span className={styles.rowValue}>지정가</span>
          </li>
          <li className={styles.row}>
            <span className={styles.rowLabel}>희망 가격</span>
            <span className={styles.rowValue}>{priceDisplay}원</span>
          </li>
          <li className={styles.row}>
            <span className={styles.rowLabel}>예상 수수료</span>
            <span className={styles.rowValue}>
              0원<span className={styles.feeNote}>수수료 무료</span>
            </span>
          </li>
          <li className={styles.row}>
            <span className={styles.rowLabel}>총 주문 금액</span>
            <span className={styles.rowValueTotal}>{totalDisplay}원</span>
          </li>
        </ul>

        <div className={styles.buttons}>
          <button className={styles.closeButton} onClick={onClose} disabled={isLoading}>
            닫기
          </button>
          <button
            className={`${styles.confirmButton} ${isBuy ? styles.confirmBuy : styles.confirmSell}`}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? '처리 중...' : actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmModal;
