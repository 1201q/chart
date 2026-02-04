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

/**
 * 지정가 매수 체결 전략
 */
@Injectable()
export class LimitBuyExecution extends BaseExecutionStrategy {
  private readonly logger = new TradingLogger(LimitBuyExecution.name);

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
    // 1. 검증
    const remaining = new Decimal(order.remainingQty);
    if (remaining.lte(0)) {
      this.logger.log(`Order ${order.id} has no remaining quantity`);
      return null;
    }

    // 2. 리소스 준비
    const resources = await this.prepareResources(manager, order);

    // 3. 매칭
    const matchResult = this.buyMatcher.match(
      {
        type: 'LIMIT',
        price: new Decimal(order.price),
        remainingQty: remaining,
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

    // 5. 주문 상태 업데이트
    order.remainingQty = matchResult.remainingQty.toString();
    order.filledQty = new Decimal(order.filledQty)
      .plus(matchResult.totalFilled)
      .toString();

    if (matchResult.remainingQty.lte(0)) {
      order.status = 'FILLED';
      order.filledAt = new Date();
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
      `LIMIT BUY filled: ${matchResult.totalFilled} (${matchResult.fills.length} fills)`,
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
