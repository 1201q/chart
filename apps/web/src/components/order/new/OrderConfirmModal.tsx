'use client';

import { useEffect, useRef } from 'react';
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

const OrderConfirmModal = ({
  code,
  side,
  price,
  qty,
  total,
  isLoading,
  onClose,
  onConfirm,
}: Props) => {
  const coinSymbol = code.split('-')[1] ?? code;
  const isBuy = side === 'BUY';
  const actionLabel = isBuy ? '매수' : '매도';

  const priceDisplay = price.toLocaleString('ko-KR', { maximumFractionDigits: 8 });
  const qtyDisplay = Number(qty.toFixed(8)).toLocaleString('ko-KR', {
    maximumFractionDigits: 8,
  });
  const totalDisplay = total.toLocaleString('ko-KR', { maximumFractionDigits: 0 });

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleBgClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    if (window.innerWidth < 1000) {
      onClose();
    } else {
      // CSS 클래스 변경 없이 Web Animations API로 직접 shake 실행
      sheetRef.current?.animate(
        [
          { transform: 'translateX(0)' },
          { transform: 'translateX(-7px)' },
          { transform: 'translateX(7px)' },
          { transform: 'translateX(-5px)' },
          { transform: 'translateX(5px)' },
          { transform: 'translateX(-3px)' },
          { transform: 'translateX(3px)' },
          { transform: 'translateX(0)' },
        ],
        { duration: 400, easing: 'cubic-bezier(0.36, 0.07, 0.19, 0.97)' },
      );
    }
  };

  // 드래그로 닫기 (touch + mouse 공통)
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef(0);
  const currentDragY = useRef(0);
  const isDraggingMouse = useRef(false);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // 뷰포트 전환 시 모달 닫기 (PC ↔ 모바일)
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1000px)');
    const handler = () => onCloseRef.current();
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

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
    if (window.innerWidth >= 1000) return;
    dragStartY.current = e.touches[0].clientY;
    if (sheetRef.current) sheetRef.current.style.transition = 'none';
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (window.innerWidth >= 1000) return;
    applyDrag(e.touches[0].clientY);
  };
  const handleTouchEnd = () => {
    if (window.innerWidth >= 1000) return;
    commitDrag();
  };

  // mouse
  const handleMouseDown = (e: React.MouseEvent) => {
    if (window.innerWidth >= 1000) return;
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

  return (
    <div className={styles.overlay} onClick={handleBgClick}>
      <div
        ref={sheetRef}
        className={styles.sheet}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ touchAction: 'none', userSelect: 'none' }}
      >
        <div className={styles.handle} />

        <p className={styles.coinName}>{coinSymbol}</p>
        <p className={styles.heading}>
          <span>{qtyDisplay}개</span>
          <span className={isBuy ? styles.headingBuy : styles.headingSell}>
            {actionLabel}
          </span>
        </p>

        <ul className={styles.rows}>
          <li className={styles.row}>
            <span className={styles.rowLabel}>주문 유형</span>
            <span className={styles.rowValue}>지정가</span>
          </li>
          <li className={styles.row}>
            <span className={styles.rowLabel}>주문 가격</span>
            <span className={styles.rowValue}>{priceDisplay}원</span>
          </li>
          <li className={styles.row}>
            <span className={styles.rowLabel}>수수료</span>
            <span className={styles.rowValue}>0원</span>
          </li>
          <li className={styles.row}>
            <span className={styles.rowLabel}>총 주문 금액</span>
            <span className={styles.rowValueTotal}>{totalDisplay}원</span>
          </li>
        </ul>

        <div
          className={styles.buttons}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          <button className={styles.closeButton} onClick={onClose} disabled={isLoading}>
            취소
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
