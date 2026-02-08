import { Injectable } from '@nestjs/common';
import Decimal from 'decimal.js-light';
import { MatchResult, FillResult, OrderbookLevel } from '../types/execution.types';
import { decimalMin } from '../../../common/helpers/decimal';

/**
 * 매도 주문 매칭 (순수 로직)
 */
@Injectable()
export class SellOrderMatcher {
  /**
   * 매도 주문과 호가 매칭
   *
   * @example
   * const result = matcher.match({
   *   type: 'LIMIT',
   *   price: new Decimal('150'),
   *   remainingQty: new Decimal('100')
   * }, [
   *   { price: new Decimal('160'), size: new Decimal('50') },
   *   { price: new Decimal('159'), size: new Decimal('60') }
   * ]);
   *
   * // 결과:
   * // fills: [{ price: 160, qty: 50 }, { price: 159, qty: 50 }]
   * // remainingQty: 0
   * // totalFilled: 100
   */
  match(
    order: {
      type: 'LIMIT' | 'MARKET';
      price: Decimal; // 지정가
      remainingQty: Decimal; // 남은 수량
    },
    bids: OrderbookLevel[], // 매수 호가 (내림차순 정렬됨)
  ): MatchResult {
    const fills: FillResult[] = [];
    let remainingQty = order.remainingQty;

    for (const level of bids) {
      if (remainingQty.lte(0)) break;
      if (level.size.lte(0)) continue;

      // 지정가 체크: 호가가 지정가보다 싸면 중단
      if (order.type === 'LIMIT' && level.price.lt(order.price)) {
        break;
      }

      const fillQty = decimalMin(remainingQty, level.size);

      fills.push({
        price: level.price, // 항상 호가 가격
        qty: fillQty,
      });

      remainingQty = remainingQty.minus(fillQty);
      level.size = level.size.minus(fillQty);
    }

    const totalFilled = order.remainingQty.minus(remainingQty);

    return {
      fills,
      remainingQty,
      totalFilled,
    };
  }
}
