'use client';

import { useTicker, useTickerStore } from '@/hooks/uses/tickers.hooks';
import { useAllPositions } from '@/utils/stores/positions.store';
import { createKrwPriceFormatter } from '@/utils/formatting/price';
import { formatChangeRate } from '@/utils/formatting/changeRate';
import Link from 'next/link';
import Image from 'next/image';
import { Star } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useIsAuthenticated } from '@/utils/context/auth.context';
import { toggleFavorite } from '@/utils/api/favorites.api';
import styles from './MainPageHoldingRow.module.css';

interface MainPageHoldingRowProps {
  code: string;
}

function formatQty(qty: number): string {
  if (qty === 0) return '0개';
  if (Number.isInteger(qty)) return `${qty.toLocaleString('ko-KR')}개`;
  // 소수점: 최대 8자리, 불필요한 뒤 0 제거
  const str = qty.toPrecision(6).replace(/\.?0+$/, '');
  return `${str}개`;
}

const MainPageHoldingRow = ({ code }: MainPageHoldingRowProps) => {
  const ticker = useTicker(code);
  const store = useTickerStore();
  const allPositions = useAllPositions();
  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();

  const position = allPositions.get(code) ?? null;

  if (!ticker || !position) return null;

  const qty = Number(position.qty);
  const avgPrice = Number(position.avgPrice);
  const cost = Number(position.cost);
  const tradePrice = ticker.tradePrice;

  const evalAmount = tradePrice * qty;
  const profit = (tradePrice - avgPrice) * qty;
  const profitRate = cost > 0 ? profit / cost : 0;

  const evalFormatter = createKrwPriceFormatter(evalAmount);
  const profitFormatter = createKrwPriceFormatter(Math.abs(profit));
  const avgFormatter = createKrwPriceFormatter(avgPrice);

  const evalAmountStr = evalFormatter.formatPrice(evalAmount);
  const profitStr = profitFormatter.formatPrice(Math.abs(profit));
  const avgPriceStr = avgFormatter.formatPrice(avgPrice);
  const profitRateStr = formatChangeRate(Math.abs(profitRate));

  const isRise = profit > 0;
  const isFall = profit < 0;
  const profitSign = isRise ? '+' : isFall ? '-' : '';
  const profitClass = isRise ? styles.rise : isFall ? styles.fall : styles.even;

  const imgSrc = `${'https://api.chartraders.club'}/markets/icon/${ticker.code.replace('KRW-', '').toUpperCase()}`;
  const isWatchlisted = store.hasWatchlist(code);

  const handleToggleWatchlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    store.toggleWatchlist(code);
    toggleFavorite(code).catch(() => {
      store.toggleWatchlist(code);
    });
  };

  return (
    <Link href={`/market/${code}`} prefetch={false} className={styles.row}>
      {/* 이름 / 보유수량 */}
      <div className={styles.nameCell}>
        <button
          className={styles.starButton}
          onClick={handleToggleWatchlist}
          type="button"
          aria-label="Toggle watchlist"
        >
          <Star
            size={18}
            fill={isWatchlisted ? 'var(--yellow)' : 'none'}
            stroke={isWatchlisted ? 'var(--yellow)' : 'var(--grey500)'}
            strokeWidth={1.5}
          />
        </button>
        <div className={styles.iconWrap}>
          <Image src={imgSrc} alt={`${ticker.code} icon`} width={24} height={24} />
        </div>
        <div className={styles.nameWrap}>
          <span className={styles.koreanName}>{ticker.koreanName}</span>
          <span className={styles.qty}>{formatQty(qty)}</span>
        </div>
      </div>

      {/* rightGroup: < 450px → 세로 2행 (평가금액 위, 평가손익+수익률 아래)
                   ≥ 450px → display:contents로 각 셀이 grid item이 됨 */}
      <div className={styles.rightGroup}>
        {/* 평가금액 */}
        <div className={styles.evalAmountCell}>
          <span className={styles.evalAmount}>{evalAmountStr}원</span>
        </div>

        {/* 수익률 (≥450px 전용 컬럼) */}
        <div className={styles.profitRateCell}>
          <span className={`${styles.profitRate} ${profitClass}`}>
            {profitSign}
            {profitRateStr}%
          </span>
        </div>

        {/* 평가손익 (+수익률: <450px에서만 인라인으로 함께 표시) */}
        <div className={styles.profitCell}>
          <span className={`${styles.profit} ${profitClass}`}>
            {profitSign}
            {profitStr}원
          </span>
          <span className={`${styles.profitRateInline} ${profitClass}`}>
            ({profitSign}
            {profitRateStr}%)
          </span>
        </div>

        {/* 평균단가 (≥768px 전용 컬럼) */}
        <div className={styles.avgPriceCell}>
          <span className={styles.avgPrice}>{avgPriceStr}원</span>
        </div>
      </div>
    </Link>
  );
};

export default MainPageHoldingRow;
