import { Injectable } from '@nestjs/common';
import Decimal from 'decimal.js-light';
import { MatchResult, FillResult, OrderbookLevel } from '../types/execution.types';
import { decimalMin } from '../utils/decimal.utils';

/**
 * 매수 주문 매칭
 * - DB x  계산만 수행
 */
@Injectable()
export class BuyOrderMatcher {
  /**
   * 매수 주문과 호가 매칭
   *
   * @example
   * const result = matcher.match({
   *   type: 'LIMIT',
   *   price: new Decimal('500'),
   *   remainingQty: new Decimal('100')
   * }, [
   *   { price: new Decimal('160'), size: new Decimal('50') },
   *   { price: new Decimal('161'), size: new Decimal('60') }
   * ]);
   *
   * // 결과:
   * // fills: [{ price: 160, qty: 50 }, { price: 161, qty: 50 }]
   * // remainingQty: 0
   * // totalFilled: 100
   */
  match(
    order: {
      type: 'LIMIT' | 'MARKET';
      price: Decimal; // 지정가 (시장가는 무시됨)
      remainingQty: Decimal; // 남은 수량
    },
    asks: OrderbookLevel[], // 매도 호가 (오름차순 정렬됨)
  ): MatchResult {
    const fills: FillResult[] = [];
    let remainingQty = order.remainingQty;

    for (const level of asks) {
      // 남은 수량이 없으면 종료
      if (remainingQty.lte(0)) break;

      // 호가에 수량이 없으면 스킵
      if (level.size.lte(0)) continue;

      // 지정가 체크: 호가가 지정가보다 비싸면 중단
      if (order.type === 'LIMIT' && level.price.gt(order.price)) {
        break;
      }

      // 체결 수량 계산: min(남은수량, 호가수량)
      const fillQty = decimalMin(remainingQty, level.size);

      // 체결 기록
      fills.push({
        price: level.price, // 항상 호가 가격
        qty: fillQty,
      });

      // 남은 수량 감소
      remainingQty = remainingQty.minus(fillQty);

      // 호가 수량 차감 (원본 수정)
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
