import { Injectable } from '@nestjs/common';
import Decimal from 'decimal.js-light';
import { BuyExecution, SellExecution } from '../types/execution.types';

/**
 * 정산 계산기
 */
@Injectable()
export class ExecutionCalculator {
  /**
   * 매수 정산 계산
   *
   * @example
   * // 지정가 500원, 실제 체결 160원, 수량 100개
   * const settlement = calculator.calculateBuyExecution({
   *   orderPrice: new Decimal('500'),
   *   fillPrice: new Decimal('160'),
   *   fillQty: new Decimal('100'),
   *   orderType: 'LIMIT'
   * });
   *
   * // 결과:
   * // actualSpend: 16,000 (160 * 100)
   * // lockedAmount: 50,000 (500 * 100)
   * // refund: 34,000 (50,000 - 16,000)
   */
  calculateBuyExecution(params: {
    orderPrice: Decimal; // 주문 가격 (지정가)
    fillPrice: Decimal; // 체결 가격 (호가 가격)
    fillQty: Decimal; // 체결 수량
    orderType: 'LIMIT' | 'MARKET';
  }): BuyExecution {
    const { orderPrice, fillPrice, fillQty, orderType } = params;

    // 실제 지출 금액 (항상 호가 가격으로 계산)
    const actualSpend = fillPrice.mul(fillQty);

    let lockedAmount: Decimal;
    let refund: Decimal;

    if (orderType === 'MARKET') {
      // 시장가: 실제 지출만큼 잠금 해제, 환불 없음
      lockedAmount = actualSpend;
      refund = new Decimal('0');
    } else {
      // 지정가: 원래 예약한 금액 전부 해제, 차액 환불
      lockedAmount = orderPrice.mul(fillQty);
      refund = lockedAmount.minus(actualSpend);
    }

    return {
      fillPrice,
      fillQty,
      actualSpend,
      lockedAmount,
      refund,
    };
  }

  /**
   * 매도 정산 계산
   *
   * @example
   * // 체결가 160원, 수량 100개
   * const settlement = calculator.calculateSellExecution({
   *   fillPrice: new Decimal('160'),
   *   fillQty: new Decimal('100'),
   * });
   *
   * // 결과:
   * // proceeds: 16,000 (160 * 100)
   */
  calculateSellExecution(params: {
    fillPrice: Decimal; // 체결 가격
    fillQty: Decimal; // 체결 수량
  }): SellExecution {
    const { fillPrice, fillQty } = params;

    // 받을 금액 (호가 가격으로 계산)
    const proceeds = fillPrice.mul(fillQty);

    return {
      fillPrice,
      fillQty,
      proceeds,
    };
  }

  /**
   * 지정가 주문의 총 예약 금액 계산
   */
  calculateLimitOrderReserve(params: {
    price: Decimal;
    qty: Decimal;
    side: 'BUY' | 'SELL';
  }): Decimal {
    const { price, qty, side } = params;

    if (side === 'BUY') {
      // 매수: KRW 예약 (price * qty)
      return price.mul(qty);
    } else {
      // 매도: 코인 수량만 예약
      return qty;
    }
  }

  /**
   * 시장가 매수의 예약 금액 계산
   */
  calculateMarketBuyReserve(totalAmount: Decimal): Decimal {
    return totalAmount;
  }

  /**
   * 시장가 매도의 예약 수량 계산
   */
  calculateMarketSellReserve(qty: Decimal): Decimal {
    return qty;
  }
}
