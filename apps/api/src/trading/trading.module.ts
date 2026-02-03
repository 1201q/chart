import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { TradingUser } from './entities/trading-user.entity';
import { TradingBalance } from './entities/trading-balance.entity';
import { TradingFill } from './entities/trading-fill.entity';
import { TradingOrder } from './entities/trading-order.entity';
import { BalancesController } from './balances/balances.controller';
import { BalancesService } from './balances/balances.service';
import { TradingTestService } from './trading.test.service';
import { TradingBootstrapService } from './trading-bootstrap.service';
import { OrdersController } from './orders/orders.controller';
import { OrdersService } from './orders/orders.service';
import { MatchingService } from './matching/matching.service';
import { ActiveMarketService } from './matching/active-market.service';
import { OrderMatchingProcessor } from './matching/order-matching.processor';
import { OrderMatchingBootstrapService } from './matching/order-matching-bootstrap.service';

import { MatchingController } from './matching/matching.controller';
import { RealtimeModule } from 'src/realtime/realtime.module';
import { FillsService } from './fills/fills.service';
import { FillsController } from './fills/fills.controller';
import { TradingTestController } from './trading-test.controller';
import { TradingPosition } from './entities/trading-position.entity';
import { PositionsController } from './positions/positions.controller';
import { PositionsService } from './positions/positions.service';
import { TradingSseController } from './sse/trading-sse.controller';
import { TradingStreamService } from './sse/trading-stream.service';
import { TradingQueryService } from './sse/trading-query.service';
import { QUEUE } from 'src/queue/queue.constants';
import { OrderbookStreamService } from 'src/realtime/orderbook/orderbook-stream.service';
import { MockOrderbookProvider } from './matching/providers/mock-orderbook.provider';
import { ExecutionCalculator } from './domain/calculators/execution.calculator';
import { PositionCalculator } from './domain/calculators/position.calculator';
import { BuyOrderMatcher } from './domain/matchers/buy-order.matcher';
import { SellOrderMatcher } from './domain/matchers/sell-order.matcher';
import { BalanceManager } from './matching/managers/balance.manager';
import { PositionManager } from './matching/managers/position.manager';
import { FillManager } from './matching/managers/fill.manager';

@Module({
  imports: [
    RealtimeModule,
    BullModule.registerQueue({ name: QUEUE.ORDER_MATCHING }),
    TypeOrmModule.forFeature([
      TradingUser,
      TradingBalance,
      TradingFill,
      TradingPosition,
      TradingOrder,
    ]),
  ],
  controllers: [
    BalancesController,
    OrdersController,
    MatchingController,
    FillsController,
    TradingTestController,
    PositionsController,
    TradingSseController,
  ],
  providers: [
    BalancesService,
    TradingBootstrapService,
    TradingTestService,
    OrdersService,
    MatchingService,
    ActiveMarketService,
    OrderMatchingProcessor,
    OrderMatchingBootstrapService,
    FillsService,
    PositionsService,
    TradingStreamService,
    TradingQueryService,

    // domain layers
    ExecutionCalculator,
    PositionCalculator,
    BuyOrderMatcher,
    SellOrderMatcher,

    // managers
    BalanceManager,
    PositionManager,
    FillManager,

    // 환경별 Orderbook Provider 주입
    {
      provide: 'ORDERBOOK_PROVIDER',
      useFactory: (orderbookStream: OrderbookStreamService) => {
        const env = process.env.NODE_ENV;

        // 테스트 환경: Mock Provider
        if (env === 'test') {
          return new MockOrderbookProvider();
        }

        // 개발/프로덕션: 실제 업비트 데이터
        return orderbookStream;
      },
      inject: [OrderbookStreamService],
    },
  ],
  exports: [ActiveMarketService],
})
export class TradingModule {}
