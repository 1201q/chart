'use client';

import { useEffect, useRef } from 'react';

interface UseDragToDismissOptions {
  /** 닫힘을 커밋하는 드래그 임계값(px). 기본값 120 */
  threshold?: number;
  /** true이면 window.innerWidth >= 1000px 에서는 drag 동작하지 않음 */
  mobileOnly?: boolean;
}

interface DragHandlers {
  handleTouchStart: (e: React.TouchEvent) => void;
  handleTouchMove: (e: React.TouchEvent) => void;
  handleTouchEnd: () => void;
  handleMouseDown: (e: React.MouseEvent) => void;
}

/**
 * 바텀시트/패널의 drag-to-dismiss 동작을 제공하는 훅.
 * MarketCoinListPanel / MobileOrderFormSheet 의 공통 로직을 추출.
 */
export function useDragToDismiss(
  sheetRef: React.RefObject<HTMLDivElement | null>,
  onClose: () => void,
  { threshold = 120, mobileOnly = false }: UseDragToDismissOptions = {},
): DragHandlers {
  const dragStartY = useRef(0);
  const currentDragY = useRef(0);
  const isDraggingMouse = useRef(false);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const isMobileBlocked = () => mobileOnly && window.innerWidth >= 1000;

  const applyDrag = (clientY: number) => {
    const delta = Math.max(0, clientY - dragStartY.current);
    currentDragY.current = delta;
    if (sheetRef.current) sheetRef.current.style.transform = `translateY(${delta}px)`;
  };

  const commitDrag = () => {
    if (currentDragY.current > threshold) {
      onCloseRef.current();
    } else {
      if (sheetRef.current) {
        sheetRef.current.style.transition = 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)';
        sheetRef.current.style.transform = '';
      }
      currentDragY.current = 0;
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isMobileBlocked()) return;
    dragStartY.current = e.touches[0].clientY;
    if (sheetRef.current) sheetRef.current.style.transition = 'none';
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isMobileBlocked()) return;
    applyDrag(e.touches[0].clientY);
  };

  const handleTouchEnd = () => {
    if (isMobileBlocked()) return;
    commitDrag();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isMobileBlocked()) return;
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
    // applyDrag/commitDrag 는 ref만 사용하므로 의존성 생략
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { handleTouchStart, handleTouchMove, handleTouchEnd, handleMouseDown };
}
