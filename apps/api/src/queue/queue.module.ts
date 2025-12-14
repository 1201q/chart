import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { QUEUE } from './queue.constants';
import { QueueProducer } from './queue.producer';

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

    BullModule.registerQueue(
      { name: QUEUE.MARKET_SYNC },
      { name: QUEUE.CMC_SYNC },
      { name: QUEUE.CMC_TRANSLATE },
      { name: QUEUE.ICON_UPLOAD },
    ),
  ],
  providers: [QueueProducer],
  exports: [QueueProducer],
})
export class QueueModule { }
