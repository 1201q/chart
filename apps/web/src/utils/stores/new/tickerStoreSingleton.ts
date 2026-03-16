import { MarketTickerWithNamesMap } from '@chart/shared-types';
import { TickerStore } from './TickerStore';

let instance: TickerStore | null = null;

/**
 * 클라이언트 싱글톤 — 홈↔마켓 네비게이션 시 SSE 재연결 방지.
 * SSR 환경에서는 요청 격리를 위해 항상 새 인스턴스를 반환한다.
 */
export function getOrCreateTickerStore(initial: MarketTickerWithNamesMap): TickerStore {
  if (typeof window === 'undefined') return new TickerStore(initial);
  if (!instance) instance = new TickerStore(initial);
  return instance;
}
