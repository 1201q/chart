'use client';

import { ReactNode } from 'react';
import { useTradingSseStream } from '@/hooks/useTradingSseStream';

interface Props {
  children: ReactNode;
}

export function TradingProvider({ children }: Props) {
  useTradingSseStream();

  return <>{children}</>;
}
