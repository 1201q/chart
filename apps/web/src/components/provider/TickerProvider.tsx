'use client';

import { ReactNode, useEffect } from 'react';
import { MarketTickerWithNamesMap } from '@chart/shared-types';
import { tickerStore } from '../../utils/tickerStore';
import { useTickerSseStream } from '@/hooks/useTickerSseStream';

interface Props {
  initialSnapshot: MarketTickerWithNamesMap;
  children: ReactNode;
}

export function TickerProvider({ initialSnapshot, children }: Props) {
  // 초기 스냅샷으로 스토어 수화
  useEffect(() => {
    tickerStore.hydrate(initialSnapshot);
  }, [initialSnapshot]);

  const { connected } = useTickerSseStream();

  return <>{children}</>;
}
