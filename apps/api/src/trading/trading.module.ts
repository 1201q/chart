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

@Module({
  imports: [
    TypeOrmModule.forFeature([TradingUser, TradingBalance, TradingFill, TradingOrder]),
  ],
  controllers: [BalancesController],
  providers: [BalancesService, TradingBootstrapService, TradingTestService],
  exports: [],
})
export class TradingModule {}
