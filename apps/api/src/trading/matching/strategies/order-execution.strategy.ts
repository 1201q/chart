import { EntityManager } from 'typeorm';
import { TradingOrder } from '../../entities/trading-order.entity';
import { TradingFill } from '../../entities/trading-fill.entity';
import { OrderbookLevel } from '../../domain/types/execution.types';

/**
 * 주문 체결 전략 인터페이스
 * - 각 주문 타입별로 구현
 */
export interface IOrderExecutionStrategy {
  /**
   * 주문 체결 실행
   *
   * @param manager - 트랜잭션 매니저
   * @param order - 체결할 주문 (락 걸린 상태)
   * @param asks - 매도 호가
   * @param bids - 매수 호가
   * @returns 체결 결과 (null이면 체결 없음)
   */
  execute(
    manager: EntityManager,
    order: TradingOrder,
    asks: OrderbookLevel[],
    bids: OrderbookLevel[],
  ): Promise<ExecutionResult | null>;
}

/**
 * 체결 결과
 */
export interface ExecutionResult {
  order: TradingOrder;
  fills: TradingFill[];
  changedBalances: any[];
  changedPosition: any;
  fillsCount: number;
}
