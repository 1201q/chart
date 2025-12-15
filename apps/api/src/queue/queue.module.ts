import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { QUEUE } from './queue.constants';
import { QueueProducer } from './queue.producer';

import { CmcSyncProcessor } from './processors/cmc-sync.processor';
import { CmcModule } from 'src/cmc/cmc.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UpbitMarket } from 'src/market/entities/upbit-market.entity';
import { QueueController } from './queue.controller';

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
          backoff: { type: 'exponential', delay: 10_000 },
          removeOnComplete: { count: 5000 },
          removeOnFail: { count: 5000 },
        },
      }),
    }),

    BullModule.registerQueue({ name: QUEUE.CMC_TRANSLATE }, { name: QUEUE.ICON_UPLOAD }),

    TypeOrmModule.forFeature([UpbitMarket]),
    CmcModule,
  ],
  controllers: [QueueController],
  providers: [QueueProducer, CmcSyncProcessor],
  exports: [QueueProducer],
})
export class QueueModule { }
