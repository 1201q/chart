import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import Decimal from 'decimal.js-light';
import { TradingOrder } from '../../entities/trading-order.entity';
import { TradingBalance } from '../../entities/trading-balance.entity';
import { TradingPosition } from '../../entities/trading-position.entity';
import { TradingFill } from '../../entities/trading-fill.entity';
import { parseMarketCode } from 'src/common/helpers/market';
import { BalanceManager } from '../managers/balance.manager';
import { PositionManager } from '../managers/position.manager';
import { FillManager } from '../managers/fill.manager';
import { ExecutionCalculator } from '../../domain/calculators/execution.calculator';
import {
  BuyExecution,
  SellExecution,
  OrderbookLevel,
} from '../../domain/types/execution.types';
import { IOrderExecutionStrategy, ExecutionResult } from './order-execution.strategy';

/**
 * 체결 전략 공통 로직
 */
@Injectable()
export abstract class BaseExecutionStrategy implements IOrderExecutionStrategy {
  constructor(
    protected readonly balanceManager: BalanceManager,
    protected readonly positionManager: PositionManager,
    protected readonly fillManager: FillManager,
    protected readonly executionCalc: ExecutionCalculator,
  ) {}

  abstract execute(
    manager: EntityManager,
    order: TradingOrder,
    asks: OrderbookLevel[],
    bids: OrderbookLevel[],
  ): Promise<ExecutionResult | null>;

  /**
   * 리소스 준비 (잔고, 포지션)
   */
  protected async prepareResources(manager: EntityManager, order: TradingOrder) {
    const { currency, symbol } = parseMarketCode(order.market);
    const userId = order.userId;

    // 잔고 조회 (데드락 방지: 정렬)
    const balances = await this.balanceManager.getMultipleWithLock(manager, userId, [
      currency,
      symbol,
    ]);

    // 포지션 조회
    const position = await this.positionManager.getOrCreateWithLock(
      manager,
      userId,
      order.market,
      symbol,
    );

    return { balances, position, currency, symbol };
  }

  /**
   * 체결 내역 적용 (잔고, 포지션 업데이트)
   */
  protected applyFills(
    order: TradingOrder,
    fills: Array<{ price: Decimal; qty: Decimal }>,
    balances: TradingBalance[],
    position: TradingPosition,
  ): TradingFill[] {
    const { currency, symbol } = parseMarketCode(order.market);
    const getBal = (ccy: string) => balances.find((b) => b.currency === ccy)!;

    const tradingFills: TradingFill[] = [];

    for (const fillData of fills) {
      // 정산 계산
      const execution =
        order.side === 'BUY'
          ? this.executionCalc.calculateBuyExecution({
              orderPrice: new Decimal(order.price),
              fillPrice: fillData.price,
              fillQty: fillData.qty,
              orderType: order.type,
            })
          : this.executionCalc.calculateSellExecution({
              fillPrice: fillData.price,
              fillQty: fillData.qty,
            });

      // 잔고 업데이트
      if (order.side === 'BUY') {
        this.applyBuyExecution(
          execution as BuyExecution,
          getBal(currency),
          getBal(symbol),
        );
      } else {
        this.applySellExecution(
          execution as SellExecution,
          getBal(currency),
          getBal(symbol),
        );
      }

      // 포지션 업데이트
      this.positionManager.applyFill(position, order.side, fillData.price, fillData.qty);

      // fill 생성
      tradingFills.push(
        this.fillManager.create({
          orderId: order.id,
          userId: order.userId,
          market: order.market,
          side: order.side,
          price: fillData.price,
          qty: fillData.qty,
        }),
      );
    }

    return tradingFills;
  }

  /**
   * 매수 체결 잔고 적용
   */
  private applyBuyExecution(
    execution: BuyExecution,
    krwBal: TradingBalance,
    coinBal: TradingBalance,
  ) {
    this.balanceManager.release(krwBal, execution.lockedAmount, execution.refund);
    this.balanceManager.increase(coinBal, execution.fillQty);
  }

  /**
   * 매도 체결 잔고 적용
   */
  private applySellExecution(
    execution: SellExecution,
    krwBal: TradingBalance,
    coinBal: TradingBalance,
  ) {
    this.balanceManager.decreaseLocked(coinBal, execution.fillQty);
    this.balanceManager.increase(krwBal, execution.proceeds);
  }

  /**
   * DB 저장
   */
  protected async persistResults(
    manager: EntityManager,
    order: TradingOrder,
    balances: TradingBalance[],
    position: TradingPosition,
    fills: TradingFill[],
  ) {
    await manager.save(TradingOrder, order);
    await manager.save(TradingBalance, balances);
    await manager.save(TradingPosition, position);
    await this.fillManager.saveAll(manager, fills);
  }
}
