import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UpbitCandle } from './candle.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UpbitCandle])],
  exports: [TypeOrmModule],
})
export class CandlesModule {}
