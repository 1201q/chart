import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import Decimal from 'decimal.js-light';
import { TradingFill } from '../../entities/trading-fill.entity';

/**
 * 체결내역 관리자
 * - Fill 엔티티 생성 및 저장
 */
@Injectable()
export class FillManager {
  /**
   * 체결내역 생성
   *
   * @example
   * const fill = fillManager.create({
   *   orderId: 'order-123',
   *   userId: 'user-1',
   *   market: 'KRW-BTC',
   *   side: 'BUY',
   *   price: new Decimal('160'),
   *   qty: new Decimal('1.5')
   * });
   */
  create(params: {
    orderId: string;
    userId: string;
    market: string;
    side: 'BUY' | 'SELL';
    price: Decimal;
    qty: Decimal;
  }): TradingFill {
    const fill = new TradingFill();
    fill.orderId = params.orderId;
    fill.userId = params.userId;
    fill.market = params.market;
    fill.side = params.side;
    fill.price = params.price.toString();
    fill.qty = params.qty.toString();

    return fill;
  }

  /**
   * 여러 체결내역 한번에 저장
   *
   * @example
   * const savedFills = await fillManager.saveAll(manager, [fill1, fill2]);
   */
  async saveAll(manager: EntityManager, fills: TradingFill[]): Promise<TradingFill[]> {
    if (fills.length === 0) return [];

    const fillRepo = manager.getRepository(TradingFill);
    return fillRepo.save(fills);
  }

  /**
   * 주문의 체결 내역 조회
   *
   * @example
   * const fills = await fillManager.findByOrderId(manager, 'order-123');
   */
  async findByOrderId(manager: EntityManager, orderId: string): Promise<TradingFill[]> {
    const fillRepo = manager.getRepository(TradingFill);
    return fillRepo.find({
      where: { orderId },
      order: { createdAt: 'ASC' },
    });
  }
}
