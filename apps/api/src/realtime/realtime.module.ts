import { Module } from '@nestjs/common';
import { MarketModule } from 'src/market/market.module';
import { TickerStreamService } from './ticker/ticker-stream.service';

import { TickerController } from './ticker/ticker.controller';
import { UpbitModule } from 'src/upbit/upbit.module';
import { TradeStreamService } from './trade/trade-stream.service';
import { TradeController } from './trade/trade.controller';
import { OrderbookStreamService } from './orderbook/orderbook-stream.service';
import { OrderbookController } from './orderbook/orderbook.controller';
// import { RealtimeBootstrapService } from './realtime-bootstrap.service';
import { CandleStreamService } from './candle/candle-stream.service';
import { CandleController } from './candle/candle.controller';
import { RealtimeHealthController } from './health/realtime-health.controller';
import { RealtimeHealthService } from './health/realtime-health.service';
// import { RealtimeSubscriptionService } from './realtime-subscription.service';
import { RealtimeBootstrapService } from './realtime-bootstrap.service';

@Module({
  imports: [MarketModule, UpbitModule],
  providers: [
    TickerStreamService,
    TradeStreamService,
    OrderbookStreamService,
    CandleStreamService,

    RealtimeHealthService,
    RealtimeBootstrapService,
  ],
  controllers: [
    TickerController,
    TradeController,
    OrderbookController,
    CandleController,
    RealtimeHealthController,
  ],
  exports: [
    TickerStreamService,
    TradeStreamService,
    OrderbookStreamService,
    CandleStreamService,
  ],
})
export class RealtimeModule { }
