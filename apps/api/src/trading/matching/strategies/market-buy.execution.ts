import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import Decimal from 'decimal.js-light';
import { TradingOrder } from '../../entities/trading-order.entity';
import { OrderbookLevel } from '../../domain/types/execution.types';
import { BuyOrderMatcher } from '../../domain/matchers/buy-order.matcher';
import { BaseExecutionStrategy } from './base-execution.strategy';
import { ExecutionResult } from './order-execution.strategy';
import { TradingLogger } from '../../common/logging.helper';
import { BalanceManager } from '../managers/balance.manager';
import { PositionManager } from '../managers/position.manager';
import { FillManager } from '../managers/fill.manager';
import { ExecutionCalculator } from '../../domain/calculators/execution.calculator';
import { formatDecimal } from '../../../common/helpers/decimal';
import { now } from '../../../common/helpers/datetime';

/**
 * 시장가 매수 체결 전략
 * - 금액 기준 체결 (remainingAmount)
 */
@Injectable()
export class MarketBuyExecution extends BaseExecutionStrategy {
  private readonly logger = new TradingLogger(MarketBuyExecution.name);

  constructor(
    balanceManager: BalanceManager,
    positionManager: PositionManager,
    fillManager: FillManager,
    executionCalc: ExecutionCalculator,
    private readonly buyMatcher: BuyOrderMatcher,
  ) {
    super(balanceManager, positionManager, fillManager, executionCalc);
  }

  async execute(
    manager: EntityManager,
    order: TradingOrder,
    asks: OrderbookLevel[],
    bids: OrderbookLevel[],
  ): Promise<ExecutionResult | null> {
    // 1. 검증: 시장가 매수는 reservedAmount 기준
    if (!order.reservedAmount) {
      this.logger.log(`MARKET BUY order ${order.id} missing reservedAmount`);
      return null;
    }

    const remainingAmount = new Decimal(order.reservedAmount);
    if (remainingAmount.lte(0)) {
      this.logger.log(`MARKET BUY order ${order.id} has no remaining amount`);
      return null;
    }

    // 2. 리소스 준비
    const resources = await this.prepareResources(manager, order);

    // 3. 매칭 (금액 기준)
    const matchResult = this.buyMatcher.match(
      {
        type: 'MARKET',
        price: new Decimal('0'), // 시장가는 가격 무관
        remainingQty: new Decimal(Number.MAX_SAFE_INTEGER), // 수량 무제한
        remainingAmount, // 금액 제한
      },
      asks,
    );

    if (matchResult.fills.length === 0) {
      return null;
    }

    // 4. 체결 적용
    const fills = this.applyFills(
      order,
      matchResult.fills,
      resources.balances,
      resources.position,
    );

    // 5. 주문 상태 업데이트 (금액 기준)
    const usedAmount = matchResult.fills.reduce(
      (sum, fill) => sum.plus(fill.price.mul(fill.qty)),
      new Decimal('0'),
    );

    const totalFilledQty = matchResult.fills.reduce(
      (sum, fill) => sum.plus(fill.qty),
      new Decimal(order.filledQty),
    );

    const newRemainingAmount = remainingAmount.minus(usedAmount);

    order.filledQty = formatDecimal(totalFilledQty);
    order.remainingQty = '0.00000001'; // 시장가 매수는 수량 개념 없음 (DB 제약 조건: QTY > 0)
    order.reservedAmount = formatDecimal(newRemainingAmount);

    // 금액 소진 체크 (1원 이하면 FILLED)
    if (newRemainingAmount.lte(1) || asks.every((lv) => lv.size.lte(0))) {
      order.status = 'FILLED';
      order.filledAt = now();
      order.reservedAmount = '0';
    }

    // 6. DB 저장
    await this.persistResults(
      manager,
      order,
      resources.balances,
      resources.position,
      fills,
    );

    this.logger.log(
      `MARKET BUY filled: qty=${formatDecimal(totalFilledQty)}, used=${formatDecimal(usedAmount)}, remaining=${formatDecimal(newRemainingAmount)}`,
    );

    return {
      order,
      fills,
      changedBalances: resources.balances,
      changedPosition: resources.position,
      fillsCount: fills.length,
    };
  }
}
