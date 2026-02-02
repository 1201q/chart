'use client';

import { MarketTickerWithNamesMap, TradingOrderDto } from '@chart/shared-types';
import styles from './styles/account.order.item.module.css';
import AccountOrderItem from './AccountOrderItem';
import { ChevronDown } from 'lucide-react';

import { useEffect, useRef, useState } from 'react';
import MonthDropdown from './MonthDropdown';

import { CompletedOrderWithFills } from '@/types/market.types';

interface AccountOrderListProps {
  data: CompletedOrderWithFills[];
  snapshot: MarketTickerWithNamesMap;
  selectedId: string | null;
  range: string;
  onChangeRange: (newRange: string) => void;
  onSelectOrder: (orderId: string) => void;
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

const AccountOrderList = ({
  data,
  snapshot,
  selectedId,
  range,
  onChangeRange,
  onSelectOrder,
}: AccountOrderListProps) => {
  const label = range
    ? `${range.split('_')[0]}년 ${Number(range.split('_')[1])}월`
    : `${new Date().getFullYear()}년 ${new Date().getMonth() + 1}월`;

  const buttonRef = useRef<HTMLButtonElement>(null);

  // 월 선택 드롭다운 상태
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);

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

  useEffect(() => {
    if (!isDropdownOpen) return;

    const update = () => {
      const el = buttonRef.current;
      if (!el) return;

      const r = el.getBoundingClientRect();
      setAnchorRect((prev) => {
        if (!prev) return r;

        // 위치/크기 같으면 state 업데이트 안 함
        // 리렌더링 방지

        if (
          prev.top === r.top &&
          prev.left === r.left &&
          prev.width === r.width &&
          prev.height === r.height
        )
          return prev;
        return r;
      });
    };

    update();
    window.addEventListener('scroll', update);
    window.addEventListener('resize', update);

    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [isDropdownOpen]);

  useEffect(() => {
    if (!isDropdownOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isDropdownOpen]);

  return (
    <div className={styles.orders}>
      <div className={styles.listHeader}>
        <h3>완료한 주문</h3>
        <button
          ref={buttonRef}
          onClick={() => setIsDropdownOpen(true)}
          className={styles.datePicker}
        >
          <span>{label}</span>
          <ChevronDown size={13} />
        </button>
        {isDropdownOpen && anchorRect && (
          <MonthDropdown
            anchorRect={anchorRect}
            currentRange={range}
            onSelect={(next) => {
              setIsDropdownOpen(false);
              onChangeRange(next);
            }}
            onClose={() => setIsDropdownOpen(false)}
          />
        )}
      </div>
      {items.map((d) => {
        const { fills, ...orderWithoutFills } = d.order;
        const id = d.order.id;

        return (
          <AccountOrderItem
            key={id}
            order={orderWithoutFills}
            fills={fills}
            showDate={d.showDate}
            koreanName={snapshot[d.order.market]?.koreanName}
            selected={selectedId === d.order.id}
            onClick={() => onSelectOrder(id)}
          />
        );
      })}
    </div>
  );
};

export default AccountOrderList;
