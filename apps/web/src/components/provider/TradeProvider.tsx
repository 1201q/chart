'use client';

import { ReactNode } from 'react';

import { useTradeListSseStream } from '@/hooks/useTradeListSseStream';
import { MarketTrade } from '@chart/shared-types';

interface Props {
  code: string;
  children: ReactNode;
  initialSnapshot: MarketTrade[];
}

export function TradeProvider({ code, children, initialSnapshot }: Props) {
  useTradeListSseStream(code, initialSnapshot);

  return <>{children}</>;
}
