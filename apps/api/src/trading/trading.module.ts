import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
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

import { MatchingController } from './matching/matching.controller';
import { RealtimeModule } from 'src/realtime/realtime.module';
import { FillsService } from './fills/fills.service';
import { FillsController } from './fills/fills.controller';
import { TradingTestController } from './trading-test.controller';
import { TradingPosition } from './entities/trading-position.entity';
import { PositionsController } from './positions/positions.controller';
import { PositionsService } from './positions/positions.service';

@Module({
  imports: [
    RealtimeModule,
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
  ],
  providers: [
    BalancesService,
    TradingBootstrapService,
    TradingTestService,
    OrdersService,
    MatchingService,
    FillsService,
    PositionsService,
  ],
  exports: [],
})
export class TradingModule {}
