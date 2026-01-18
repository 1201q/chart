'use client';

import styles from '../styles/market.orderbook.module.css';
import { createKrwPriceFormatter } from '@/utils/formatting/price';
import { formatSignedChangeRate } from '@/utils/formatting/changeRate';
import MarketOrderbookTradeList from './NewMarketOrderbookTradeList';
import { createKrwVolumeFormatter } from '@/utils/formatting/volume';
import MarketOrderbookSideInfo from './NewMarketOrderbookSideInfo';
import MarketOrderbookBalanceBar from './NewMarketOrderbookBalanceBar';
// import { useOrderFormActions } from '../provider/OrderFormProvider';

import { useOrderbookRow } from '@/hooks/uses/orderbook.hooks';
import { useTickerSelector2 } from '@/hooks/uses/tickers.hooks';

type RowProps = {
  type: 'blue' | 'red';
  index: number;
  closePrice: number;
  code: string;
};

const MarketOrderbookList = ({ code }: { code: string }) => {
  const highPrice = useTickerSelector2(code, (s) => s?.highPrice ?? 0);
  const closePrice = useTickerSelector2(code, (s) => s?.prevClosingPrice ?? 0);
  const indexRows = Array.from({ length: 60 }, (_, i) => i);

  const half = Math.ceil(indexRows.length / 2);

  const topRows = indexRows.slice(half / 2, half);
  const bottomRows = indexRows.slice(half, half + half / 2);

  return (
    <div className={styles.orderbook}>
      <MarketOrderbookBalanceBar highPrice={highPrice} />
      <div className={styles.topArea}>
        <div className={styles.topRows}>
          {topRows.map((i) => (
            <MarketOrderbookRow
              key={i}
              index={i}
              type={'blue'}
              code={code}
              closePrice={closePrice}
            />
          ))}
        </div>
        <div className={styles.info}>
          <MarketOrderbookSideInfo code={code} />
        </div>
      </div>
      <div className={styles.divider}></div>
      <div className={styles.bottomArea}>
        <div className={styles.info}>
          <MarketOrderbookTradeList code={code} />
        </div>
        <div className={styles.bottomRows}>
          {bottomRows.map((i) => (
            <MarketOrderbookRow
              key={i}
              index={i}
              type={'red'}
              code={code}
              closePrice={closePrice}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const MarketOrderbookRow = ({ type, index, closePrice, code }: RowProps) => {
  const row = useOrderbookRow(index);

  const isCurrentPrice = useTickerSelector2(code, (s) => s?.tradePrice === row.price);

  const formatter = createKrwPriceFormatter(row.price);
  const volumeFormatter = createKrwVolumeFormatter(row.price);
  // const store = useOrderFormActions();

  const textClass =
    row.price - closePrice > 0
      ? styles.rise
      : row.price - closePrice < 0
        ? styles.fall
        : styles.even;

  const formattedPrice = formatter.formatPrice(row.price);

  return (
    <div className={`${type === 'blue' ? styles.topRow : styles.bottomRow}`}>
      <div className={styles.center}>
        <button
          className={`${styles.centerButton} ${isCurrentPrice ? styles.isCurrent : ''}`}
          // onClick={() => store.setPrice(row.price, true)}
        >
          <p className={textClass}>{formattedPrice}</p>
          <span>{formatSignedChangeRate((row.price - closePrice) / closePrice)}%</span>
        </button>
      </div>
      <div className={styles.side}>
        <p>{volumeFormatter.formatVolume(row.size)}</p>
        <div className={styles.barWrapper}>
          <div
            className={styles.bar}
            style={
              type === 'red'
                ? { transform: `translateX(${row.width}%)` }
                : { transform: `translateX(-${row.width}%)` }
            }
          ></div>
        </div>
      </div>
    </div>
  );
};

// const LoadingMarketOrderbook = () => {
//   return (
//     <div className={styles.loadingWrapper}>
//       <LoadingSpinner />
//     </div>
//   );
// };

export default MarketOrderbookList;
