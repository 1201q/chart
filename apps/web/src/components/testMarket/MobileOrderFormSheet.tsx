'use client';

import { useEffect, useRef } from 'react';
import styles from './styles/MobileOrderFormSheet.module.css';
import dynamic from 'next/dynamic';
import { useOrderFormSelector } from '@/hooks/uses/orderform.hooks';

const OrderForm = dynamic(() => import('@/components/order/new/NewOrderForm'), {
  ssr: false,
});

interface Props {
  code: string;
  authenticated: boolean;
  onClose: () => void;
}

const MobileOrderFormSheet = ({ code, authenticated, onClose }: Props) => {
  const side = useOrderFormSelector((s) => s.side);
  const isBuy = side === 'BUY';

  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef(0);
  const currentDragY = useRef(0);
  const isDraggingMouse = useRef(false);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const applyDrag = (clientY: number) => {
    const delta = Math.max(0, clientY - dragStartY.current);
    currentDragY.current = delta;
    if (sheetRef.current) sheetRef.current.style.transform = `translateY(${delta}px)`;
  };

  const commitDrag = () => {
    if (currentDragY.current > 120) {
      onCloseRef.current();
    } else {
      if (sheetRef.current) {
        sheetRef.current.style.transition =
          'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)';
        sheetRef.current.style.transform = '';
      }
      currentDragY.current = 0;
    }
  };

  // touch
  const handleTouchStart = (e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY;
    if (sheetRef.current) sheetRef.current.style.transition = 'none';
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    applyDrag(e.touches[0].clientY);
  };
  const handleTouchEnd = () => {
    commitDrag();
  };

  // mouse
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingMouse.current = true;
    dragStartY.current = e.clientY;
    if (sheetRef.current) sheetRef.current.style.transition = 'none';
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingMouse.current) return;
      applyDrag(e.clientY);
    };
    const onMouseUp = () => {
      if (!isDraggingMouse.current) return;
      isDraggingMouse.current = false;
      commitDrag();
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

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
          <OrderForm
            code={code}
            hideHistory
            authenticated={authenticated}
            onOrderSuccess={onClose}
            isInMobileSheet
          />
        </div>
      </div>
    </div>
  );
};

export default MobileOrderFormSheet;
