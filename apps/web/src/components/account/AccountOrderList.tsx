'use client';

import {
  MarketTickerWithNamesMap,
  TradingFillDto,
  TradingOrderDto,
} from '@chart/shared-types';
import styles from './styles/account.order.item.module.css';
import AccountOrderItem from './AccountOrderItem';
import { ChevronDown } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import MonthDropdown from './MonthDropdown';
import { useSearchParams } from 'next/navigation';

interface AccountOrderListProps {
  data: (TradingOrderDto & { fills: TradingFillDto[] })[];
  snapshot: MarketTickerWithNamesMap;
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

const AccountOrderList = ({ data, snapshot }: AccountOrderListProps) => {
  const { slug } = useParams();
  const sp = useSearchParams();
  const range = sp.get('range'); // "2025_12"
  const label = range
    ? `${range.split('_')[0]}년 ${Number(range.split('_')[1])}월`
    : `${new Date().getFullYear()}년 ${new Date().getMonth() + 1}월`;

  const buttonRef = useRef<HTMLButtonElement>(null);

  // 월 선택 드롭다운 상태
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);

  const selectedId = slug ? slug[0] : null;

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
      <div className={styles.listController}>
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
              onClose={() => setIsDropdownOpen(false)}
            />
          )}
        </div>
      </div>
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
