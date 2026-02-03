import { MarketOrderbook } from '@chart/shared-types';

/**
 * 호가창 데이터 제공 인터페이스
 * - 실제: OrderbookStreamService (업비트 실시간)
 * - 테스트: MockOrderbookProvider (고정 데이터)
 */
export interface IOrderbookProvider {
  /**
   * 특정 마켓의 최신 호가창 조회
   * @param code 마켓 코드 (예: 'KRW-BTC')
   * @returns 호가창 스냅샷 또는 undefined
   */
  getSnapshotByCode(code: string): MarketOrderbook | undefined;
}
