import Decimal from 'decimal.js-light';

/**
 * 매수 정산 결과
 */
export interface BuyExecution {
  fillPrice: Decimal; // 체결 가격 (호가 가격)
  fillQty: Decimal; // 체결 수량
  actualSpend: Decimal; // 실제 지출 (fillPrice * fillQty)
  lockedAmount: Decimal; // 잠금 해제할 금액
  refund: Decimal; // 환불액 => (지정가일 경우 차액)
}

/**
 * 매도 정산 결과
 */
export interface SellExecution {
  fillPrice: Decimal; // 체결 가격
  fillQty: Decimal; // 체결 수량
  proceeds: Decimal; // 받을 금액 (fillPrice * fillQty)
}

/**
 * 체결 결과 (단일)
 */
export interface FillResult {
  price: Decimal; // 체결 가격
  qty: Decimal; // 체결 수량
}

/**
 * 매칭 결과
 */
export interface MatchResult {
  fills: FillResult[]; // 체결 목록
  remainingQty: Decimal; // 남은 수량
  totalFilled: Decimal; // 총 체결 수량
}

/**
 * 포지션 스냅샷
 */
export interface PositionSnapshot {
  qty: Decimal; // 보유 수량
  avgPrice: Decimal; // 평균 단가
  cost: Decimal; // 총 비용
  realizedPnl: Decimal; // 실현 손익
}

/**
 * 호가 레벨
 */
export interface OrderbookLevel {
  price: Decimal;
  size: Decimal;
}
