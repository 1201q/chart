import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { QUEUE } from 'src/queue/queue.constants';
import { MarketModule } from 'src/market/market.module';
import { CandlesModule } from 'src/candles/candles.module';
import { QueueModule } from 'src/queue/queue.module';
import { TickerStreamService } from './ticker/ticker-stream.service';

import { TickerController } from './ticker/ticker.controller';
import { UpbitModule } from 'src/upbit/upbit.module';
import { TradeStreamService } from './trade/trade-stream.service';
import { TradeController } from './trade/trade.controller';
import { OrderbookStreamService } from './orderbook/orderbook-stream.service';
import { OrderbookController } from './orderbook/orderbook.controller';
import { CandleStreamService } from './candle/candle-stream.service';
import { CandleVolumeTracker } from './candle/candle-volume-tracker.service';
import { CandleInitProcessor } from './candle/candle-init.processor';
import { CandleRefreshProcessor } from 'src/queue/processors/candle-refresh.processor';
import { CandleController } from './candle/candle.controller';
import { RealtimeHealthController } from './health/realtime-health.controller';
import { RealtimeHealthService } from './health/realtime-health.service';
import { RealtimeBootstrapService } from './realtime-bootstrap.service';
import { MockTickerStreamService } from './mock/mock-ticker-stream.service';
import { MockOrderbookStreamService } from './mock/mock-orderbook-stream.service';
import { MockTradeStreamService } from './mock/mock-trade-stream.service';
import { MockController } from './mock/mock.controller';

@Module({
  imports: [
    ConfigModule,
    MarketModule,
    UpbitModule,
    CandlesModule,
    forwardRef(() => QueueModule),
    BullModule.registerQueue({ name: QUEUE.CANDLE_RECOVERY }),
    BullModule.registerQueue({ name: QUEUE.CANDLE_INIT }),
    BullModule.registerQueue({ name: QUEUE.CANDLE_REFRESH }),
  ],
  providers: [
    TickerStreamService,
    TradeStreamService,
    OrderbookStreamService,
    CandleStreamService,
    CandleVolumeTracker,
    CandleInitProcessor,
    CandleRefreshProcessor,

    RealtimeHealthService,
    RealtimeBootstrapService,

    MockTickerStreamService,
    MockOrderbookStreamService,
    MockTradeStreamService,
  ],
  controllers: [
    TickerController,
    TradeController,
    OrderbookController,
    CandleController,
    RealtimeHealthController,

    MockController,
  ],
  exports: [
    TickerStreamService,
    TradeStreamService,
    OrderbookStreamService,
    CandleStreamService,
    CandleVolumeTracker,
  ],
})
export class RealtimeModule {}
