import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { QUEUE } from './queue.constants';
import { QueueProducer } from './queue.producer';

import { TypeOrmModule } from '@nestjs/typeorm';
import { UpbitMarket } from 'src/market/entities/upbit-market.entity';
import { QueueController } from './queue.controller';
import { OracleBucketModule } from 'src/bucket/oralce.bucket.module';
import { IconSyncProcessor } from './processors/icon-sync.processor';
import { CoinInfo } from 'src/market/entities/coin-info.entity';

@Module({
  imports: [
    ConfigModule,
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        connection: {
          host: config.get<string>('REDIS_HOST', '127.0.0.1'),
          port: config.get<number>('REDIS_PORT', 6379),
        },
        defaultJobOptions: {
          attempts: 5,
          backoff: { type: 'exponential', delay: 5_000 },
          removeOnComplete: { count: 200 },
          removeOnFail: { count: 500 },
        },
      }),
    }),
    BullModule.registerQueue({ name: QUEUE.ICON_UPLOAD }, { name: QUEUE.CMC_TRANSLATE }),
    TypeOrmModule.forFeature([UpbitMarket, CoinInfo]),
    OracleBucketModule,
  ],
  controllers: [QueueController],
  providers: [QueueProducer, IconSyncProcessor],
  exports: [QueueProducer],
})
export class QueueModule {}
