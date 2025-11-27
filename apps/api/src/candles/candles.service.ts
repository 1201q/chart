import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpbitCandle } from './candle.entity';

import { GetCandlesQueryDto } from './candles.dto';

import {
  CandleResponseDto,
  UpbitCandleTimeframeUrl,
  UpbitCandleTimeframeMap,
} from '@chart/shared-types';

@Injectable()
export class CandlesService {
  constructor(
    @InjectRepository(UpbitCandle)
    private readonly candleRepo: Repository<UpbitCandle>,
  ) {}

  async getCandles(
    market: string,
    timeframeUrl: UpbitCandleTimeframeUrl,
    query: GetCandlesQueryDto,
  ): Promise<CandleResponseDto[]> {
    const timeframe = UpbitCandleTimeframeMap[timeframeUrl];

    if (!timeframe) {
      throw new BadRequestException('unsupported timeframe');
    }

    console.log('Get candles', { market, timeframe, query });
    const count = query.count ?? 400;

    const qb = this.candleRepo
      .createQueryBuilder('c')
      .where('c.market = :market', { market })
      .andWhere('c.timeframe = :timeframe', {
        timeframe,
      });

    if (query.to) {
      const toDate = new Date(query.to);
      if (Number.isNaN(toDate.getTime())) {
        throw new BadRequestException('Invalid "to"');
      }
      qb.andWhere('c.candleTime <= :to', { to: toDate });
    }

    qb.orderBy('c.candleTime', 'DESC').limit(count);

    const rows = await qb.getMany();

    const reversed = rows.reverse();

    return reversed.map((row) => this.toResponseDto(row));
  }

  private toResponseDto(candle: UpbitCandle): CandleResponseDto {
    return {
      time: candle.candleTime.toISOString(),
      open: Number(candle.open),
      high: Number(candle.high),
      low: Number(candle.low),
      close: Number(candle.close),
      accVolume: Number(candle.accVolume),
      accPrice: Number(candle.accPrice),
    };
  }
}
