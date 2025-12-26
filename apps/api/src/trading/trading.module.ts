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

@Module({
  imports: [
    RealtimeModule,
    TypeOrmModule.forFeature([TradingUser, TradingBalance, TradingFill, TradingOrder]),
  ],
  controllers: [BalancesController, OrdersController, MatchingController],
  providers: [
    BalancesService,
    TradingBootstrapService,
    TradingTestService,
    OrdersService,
    MatchingService,
  ],
  exports: [],
})
export class TradingModule {}
