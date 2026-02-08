import { Injectable, BadRequestException } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import Decimal from 'decimal.js-light';
import { TradingPosition } from '../../entities/trading-position.entity';
import { PositionCalculator } from '../../domain/calculators/position.calculator';
import { PositionSnapshot } from '../../domain/types/execution.types';
import { TradingLogger } from 'src/trading/common/logging.helper';
import { formatDecimal } from '../../../common/helpers/decimal';

/**
 * 포지션 관리자
 * - DB CRUD + 계산 적용
 */
@Injectable()
export class PositionManager {
  private readonly tradingLogger = new TradingLogger(PositionManager.name);

  constructor(private readonly positionCalculator: PositionCalculator) {}

  /**
   * 포지션 조회 (없으면 생성) + 락
   *
   * @example
   * const position = await positionManager.getOrCreateWithLock(
   *   manager,
   *   'user-1',
   *   'KRW-BTC',
   *   'BTC'
   * );
   */
  async getOrCreateWithLock(
    manager: EntityManager,
    userId: string,
    market: string,
    assetSymbol: string,
  ): Promise<TradingPosition> {
    const posRepo = manager.getRepository(TradingPosition);

    // 1차 조회 (락)
    let position = await posRepo.findOne({
      where: { userId, market },
      lock: { mode: 'pessimistic_write' },
    });

    // 없으면 생성
    if (!position) {
      position = posRepo.create({
        userId,
        market,
        assetSymbol,
        qty: '0',
        avgPrice: '0',
        cost: '0',
        realizedPnl: '0',
      });
      await posRepo.save(position);

      // 2차 조회 (락)
      position = await posRepo.findOne({
        where: { userId, market },
        lock: { mode: 'pessimistic_write' },
      });

      if (!position) {
        throw new BadRequestException('Failed to create position');
      }
    }

    return position;
  }

  /**
   * 체결 적용 (매수/매도)
   *
   * @example
   * // 매수 체결
   * positionManager.applyFill(
   *   position,
   *   'BUY',
   *   new Decimal('160'),
   *   new Decimal('100')
   * );
   *
   * // 매도 체결
   * positionManager.applyFill(
   *   position,
   *   'SELL',
   *   new Decimal('200'),
   *   new Decimal('50')
   * );
   */
  applyFill(
    position: TradingPosition,
    side: 'BUY' | 'SELL',
    fillPrice: Decimal,
    fillQty: Decimal,
  ): void {
    // 현재 포지션 스냅샷
    const current: PositionSnapshot = {
      qty: new Decimal(position.qty),
      avgPrice: new Decimal(position.avgPrice),
      cost: new Decimal(position.cost),
      realizedPnl: new Decimal(position.realizedPnl),
    };

    // Calculator에 위임
    const updated =
      side === 'BUY'
        ? this.positionCalculator.applyBuy(current, fillPrice, fillQty)
        : this.positionCalculator.applySell(current, fillPrice, fillQty);

    // 엔티티 업데이트 (8자리 포맷)
    position.qty = formatDecimal(updated.qty);
    position.avgPrice = formatDecimal(updated.avgPrice);
    position.cost = formatDecimal(updated.cost);
    position.realizedPnl = formatDecimal(updated.realizedPnl);

    this.tradingLogger.logPositionUpdated(
      position.market,
      side,
      position.qty,
      position.avgPrice,
      position.cost,
    );

    if (updated.qty.isZero()) {
      this.tradingLogger.logPositionClosed(position.market, position.realizedPnl);
    }
  }

  /**
   * 현재 미실현 손익 계산
   *
   * @example
   * const unrealizedPnl = positionManager.calculateUnrealizedPnl(
   *   position,
   *   new Decimal('180')  // 현재가
   * );
   */
  calculateUnrealizedPnl(position: TradingPosition, currentPrice: Decimal): Decimal {
    const snapshot: PositionSnapshot = {
      qty: new Decimal(position.qty),
      avgPrice: new Decimal(position.avgPrice),
      cost: new Decimal(position.cost),
      realizedPnl: new Decimal(position.realizedPnl),
    };

    return this.positionCalculator.calculateUnrealizedPnl(snapshot, currentPrice);
  }
}
