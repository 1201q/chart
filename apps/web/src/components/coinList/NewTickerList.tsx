'use client';

import { useSortedTickerCodes, useTicker } from '@/hooks/uses/tickers.hooks';

import NewTickerItem from './NewTickerItem';
import { useVirtualizer } from '@tanstack/react-virtual';
import styles from './styles/coinlist.module.css';
import { useRef } from 'react';
import NewTickerItem2 from './NewTickerItem2';

const ITEM_HEIGHT = 50;

const NewTickerList = () => {
  const codes = useSortedTickerCodes();

  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: codes.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ITEM_HEIGHT,
    overscan: 5,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();

  return (
    <div className={styles.listWrapper} ref={parentRef}>
      <div style={{ height: totalSize, position: 'relative' }}>
        {codes.map((code) => (
          <NewTickerListItem key={code} code={code} />
        ))}
        {/* {virtualItems.map((v) => {
          const code = codes[v.index];

          return (
            <div
              key={code}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${v.start}px)`,
              }}
            >
              <NewTickerListItem code={code} />
            </div>
          );
        })} */}
      </div>
    </div>
  );
};

// 원복
// const NewTickerListItem = ({ code }: { code: string }) => {
//   const ticker = useTicker(code);
//   if (!ticker) return null;

//   return <NewTickerItem ticker={ticker} />;
// };

const NewTickerListItem = ({ code }: { code: string }) => {
  const ticker = useTicker(code);
  if (!ticker) return null;

  return <NewTickerItem2 ticker={ticker} />;
};

export default NewTickerList;
