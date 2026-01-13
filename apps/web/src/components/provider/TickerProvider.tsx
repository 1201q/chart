'use client';

import { ReactNode, useEffect } from 'react';
import { MarketTickerWithNamesMap } from '@chart/shared-types';
import { tickerStore } from '../../utils/stores/ticker.store';
import { useTickerSseStream } from '@/hooks/useTickerSseStream';

interface Props {
  initialSnapshot: MarketTickerWithNamesMap;
  children: ReactNode;
}

export function TickerProvider({ initialSnapshot, children }: Props) {
  useEffect(() => {
    // 초기 스냅샷으로 스토어 수화
    tickerStore.hydrate(initialSnapshot);
  }, [initialSnapshot]);

  useTickerSseStream();

  return <>{children}</>;
}
