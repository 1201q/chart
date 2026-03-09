'use client';

import { useRef } from 'react';
import styles from './styles/MobileOrderFormSheet.module.css';
import { useOrderFormSelector } from '@/hooks/uses/orderform.hooks';
import { useDragToDismiss } from '@/hooks/uses/useDragToDismiss';
import OrderForm from '@/components/order/OrderForm';
import WalletUninitializedView from '@/components/deposit/WalletUninitializedView';

interface Props {
  code: string;
  authenticated: boolean;
  isInitialized: boolean;
  onClose: () => void;
}

const MobileOrderFormSheet = ({ code, authenticated, isInitialized, onClose }: Props) => {
  const side = useOrderFormSelector((s) => s.side);
  const isBuy = side === 'BUY';
  void isBuy; // side 표시용 (현재 UI에서 미사용, 추후 확장)

  const sheetRef = useRef<HTMLDivElement>(null);
  const { handleTouchStart, handleTouchMove, handleTouchEnd, handleMouseDown } =
    useDragToDismiss(sheetRef, onClose);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div
        ref={sheetRef}
        className={styles.sheet}
        style={{ touchAction: 'none', userSelect: 'none' }}
      >
        <div
          className={styles.handle}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />
        <p className={styles.title}>주문</p>
        <div
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          style={{ touchAction: 'auto', userSelect: 'auto' }}
        >
          {!isInitialized ? (
            <WalletUninitializedView compact />
          ) : (
            <OrderForm
              code={code}
              hideHistory
              authenticated={authenticated}
              onOrderSuccess={onClose}
              isInMobileSheet
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileOrderFormSheet;
