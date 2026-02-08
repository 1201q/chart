import { Injectable } from '@nestjs/common';
import Decimal from 'decimal.js-light';
import { PositionSnapshot } from '../types/execution.types';

/**
 * 포지션 계산기
 * - 평균 단가, 실현 손익 계산
 */
@Injectable()
export class PositionCalculator {
  /**
   * 매수 시 포지션 업데이트
   *
   * @example
   * // 현재: 보유 100개, 평단 150원
   * // 매수: 50개를 200원에
   * const updated = calculator.applyBuy({
   *   qty: new Decimal('100'),
   *   avgPrice: new Decimal('150'),
   *   cost: new Decimal('15000'),
   *   realizedPnl: new Decimal('0')
   * }, new Decimal('200'), new Decimal('50'));
   *
   * // 결과:
   * // qty: 150
   * // avgPrice: 166.67 ((15000 + 10000) / 150)
   * // cost: 25000
   */
  applyBuy(
    current: PositionSnapshot,
    fillPrice: Decimal,
    fillQty: Decimal,
  ): PositionSnapshot {
    // 이번 매수 비용
    const spend = fillPrice.mul(fillQty);

    // 총 비용 누적
    const newCost = current.cost.plus(spend);

    // 보유 수량 증가
    const newQty = current.qty.plus(fillQty);

    // 평균 단가 재계산
    const newAvgPrice = newQty.gt(0) ? newCost.div(newQty) : new Decimal('0');

    return {
      qty: newQty,
      avgPrice: newAvgPrice,
      cost: newCost,
      realizedPnl: current.realizedPnl, // 실현손익은 변하지 않음
    };
  }

  /**
   * 매도 시 포지션 업데이트 + 실현손익 계산
   *
   * @example
   * // 현재: 보유 100개, 평단 150원
   * // 매도: 50개를 200원에
   * const updated = calculator.applySell({
   *   qty: new Decimal('100'),
   *   avgPrice: new Decimal('150'),
   *   cost: new Decimal('15000'),
   *   realizedPnl: new Decimal('0')
   * }, new Decimal('200'), new Decimal('50'));
   *
   * // 결과:
   * // qty: 50
   * // avgPrice: 150 (변하지 않음)
   * // cost: 7500 (150 * 50)
   * // realizedPnl: 2500 ((200 - 150) * 50)
   */
  applySell(
    current: PositionSnapshot,
    fillPrice: Decimal,
    fillQty: Decimal,
  ): PositionSnapshot {
    // 보유 수량 감소
    const newQty = current.qty.minus(fillQty);

    if (newQty.lt(0)) {
      throw new Error('Position quantity cannot be negative');
    }

    // 실현 손익 계산: (매도가 - 평단) * 수량
    const realized = fillPrice.minus(current.avgPrice).mul(fillQty);
    const newRealizedPnl = current.realizedPnl.plus(realized);

    if (newQty.eq(0)) {
      // 전량 매도: 포지션 초기화
      return {
        qty: new Decimal('0'),
        avgPrice: new Decimal('0'),
        cost: new Decimal('0'),
        realizedPnl: newRealizedPnl,
      };
    }

    // 부분 매도: 평단 유지, 비용만 감소
    const newCost = current.avgPrice.mul(newQty);

    return {
      qty: newQty,
      avgPrice: current.avgPrice, // 평단은 변하지 않음
      cost: newCost,
      realizedPnl: newRealizedPnl,
    };
  }

  /**
   * 미실현 손익 계산
   */
  calculateUnrealizedPnl(position: PositionSnapshot, currentPrice: Decimal): Decimal {
    if (position.qty.lte(0)) {
      return new Decimal('0');
    }

    // (현재가 - 평단) * 보유수량
    return currentPrice.minus(position.avgPrice).mul(position.qty);
  }
}
