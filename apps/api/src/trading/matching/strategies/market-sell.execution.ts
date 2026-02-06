import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import Decimal from 'decimal.js-light';
import { TradingOrder } from '../../entities/trading-order.entity';
import { OrderbookLevel } from '../../domain/types/execution.types';
import { SellOrderMatcher } from '../../domain/matchers/sell-order.matcher';
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
 * 시장가 매도 체결 전략
 */
@Injectable()
export class MarketSellExecution extends BaseExecutionStrategy {
  private readonly logger = new TradingLogger(MarketSellExecution.name);

  constructor(
    balanceManager: BalanceManager,
    positionManager: PositionManager,
    fillManager: FillManager,
    executionCalc: ExecutionCalculator,
    private readonly sellMatcher: SellOrderMatcher,
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
    const matchResult = this.sellMatcher.match(
      {
        type: 'MARKET',
        price: new Decimal('0'), // 시장가는 가격 무관
        remainingQty: remaining,
      },
      bids,
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
    order.remainingQty = formatDecimal(matchResult.remainingQty);
    order.filledQty = formatDecimal(
      new Decimal(order.filledQty).plus(matchResult.totalFilled),
    );

    if (matchResult.remainingQty.lte(0)) {
      order.status = 'FILLED';
      order.filledAt = now();
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
      `MARKET SELL filled: ${matchResult.totalFilled} (${matchResult.fills.length} fills)`,
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
