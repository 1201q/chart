import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { UpbitCandle } from './candle.entity';

import { GetCandlesQueryDto } from './candles.dto';

import {
  CandleResponseDto,
  UpbitCandleTimeframeUrl,
  UpbitCandleTimeframeMap,
} from '@chart/shared-types';
import { UpbitHttpService } from 'src/upbit/upbit.http.service';

@Injectable()
export class CandlesService {
  private readonly logger = new Logger(CandlesService.name);

  constructor(
    @InjectRepository(UpbitCandle)
    private readonly candleRepo: Repository<UpbitCandle>,

    private readonly upbitHttpService: UpbitHttpService,
  ) {}

  async getCandles(
    market: string,
    timeframeUrl: UpbitCandleTimeframeUrl,
    query: GetCandlesQueryDto,
  ): Promise<CandleResponseDto[]> {
    const count = query.count ?? 400;

    const dbCandles = await this.getCandlesFromDb(market, timeframeUrl, query);

    // to가 붙은 경우는 db 데이터만 반환
    if (query.to) {
      return dbCandles;
    }

    // upbit rest api로 부족한 데이터 보충
    const upbitCandles = await this.getCandlesFromUpbit(market, timeframeUrl, count);

    // 실패한 경우 db 데이터만 반환
    if (upbitCandles.length === 0) {
      return dbCandles;
    }

    const merged = await this.mergeCandles(
      market,
      timeframeUrl,
      dbCandles,
      upbitCandles,
      count,
    );

    console.log(`[merge] 머지된 캔들 ${merged.length}개`);

    return merged;
  }

  async getCandlesFromDb(
    market: string,
    timeframeUrl: UpbitCandleTimeframeUrl,
    query: GetCandlesQueryDto,
  ): Promise<CandleResponseDto[]> {
    const timeframe = UpbitCandleTimeframeMap[timeframeUrl];

    if (!timeframe) {
      throw new BadRequestException('unsupported timeframe');
    }

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

    if (reversed.length === 0) {
      console.log('db상의 캔들: 0개');
      return [];
    }

    console.log(
      `db상의 캔들: ${reversed[0].candleTime.toISOString()} ~ ${reversed[reversed.length - 1].candleTime.toISOString()} (${reversed.length}개)`,
    );

    return reversed.map((row) => this.toResponseDto(row));
  }

  async getCandlesFromUpbit(
    market: string,
    timeframeUrl: UpbitCandleTimeframeUrl,
    count: number,
  ): Promise<CandleResponseDto[]> {
    const upbitCandles = await this.upbitHttpService.getCandles(
      market,
      timeframeUrl,
      count,
    );

    const reversed = upbitCandles.reverse();

    return reversed.map((item) => ({
      time: this.normalizeUtcIsoString(item.candle_date_time_utc),
      open: item.opening_price,
      high: item.high_price,
      low: item.low_price,
      close: item.trade_price,
      accVolume: item.candle_acc_trade_volume,
      accPrice: item.candle_acc_trade_price,
    }));
  }

  private async mergeCandles(
    market: string,
    timeframeUrl: UpbitCandleTimeframeUrl,
    dbCandles: CandleResponseDto[],
    upbitCandles: CandleResponseDto[],
    finalCount: number,
  ): Promise<CandleResponseDto[]> {
    const map = new Map<string, CandleResponseDto>();

    const timeframe = UpbitCandleTimeframeMap[timeframeUrl];

    if (!timeframe) {
      throw new BadRequestException('unsupported timeframe');
    }

    // 1. db 데이터 먼저
    for (const candle of dbCandles) {
      map.set(candle.time, candle);
      console.log(candle.time);
    }

    let inserted = 0;
    let updated = 0;

    // 실제로 DB에 반영할 엔티티 목록
    const upsertCandleList: DeepPartial<UpbitCandle>[] = [];

    // 2. rest 데이터로 덮어쓰기
    for (const candle of upbitCandles) {
      const prev = map.get(candle.time);

      // 만약 db에 없던 데이터라면 새로 추가.
      if (!prev) {
        inserted += 1;
        map.set(candle.time, candle);

        const partial: DeepPartial<UpbitCandle> = {
          market,
          timeframe,
          candleTime: new Date(candle.time),
          open: String(candle.open),
          high: String(candle.high),
          low: String(candle.low),
          close: String(candle.close),
          accVolume: String(candle.accVolume),
          accPrice: String(candle.accPrice),
        };

        upsertCandleList.push(partial);

        console.log(`❌ 캔들 없음 감지: ${candle.time}`);
        continue;
      }

      // db에 있던 time이라면 값이 다른지 체크
      const changed =
        prev.open !== candle.open ||
        prev.high !== candle.high ||
        prev.low !== candle.low ||
        prev.close !== candle.close ||
        prev.accVolume !== candle.accVolume ||
        prev.accPrice !== candle.accPrice;

      if (changed) {
        updated += 1;
        map.set(candle.time, candle);

        const partial: DeepPartial<UpbitCandle> = {
          market,
          timeframe,
          candleTime: new Date(candle.time),
          open: String(candle.open),
          high: String(candle.high),
          low: String(candle.low),
          close: String(candle.close),
          accVolume: String(candle.accVolume),
          accPrice: String(candle.accPrice),
        };
        upsertCandleList.push(partial);

        console.log(`⚠️ 캔들 변경 감지: ${candle.time}`);
      }
    }

    if (upsertCandleList.length > 0) {
      const entities = this.candleRepo.create(upsertCandleList);
      await this.candleRepo.save(entities);
      // await this.candleRepo.upsert(upsertCandleList, [
      //   'market',
      //   'timeframe',
      //   'candleTime',
      // ]);

      console.log(upsertCandleList);
      console.log(`DB에 ${upsertCandleList.length}개 캔들 업서트 완료`);
    }

    const merged = Array.from(map.values()).sort(
      (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime(),
    );

    if (merged.length <= finalCount) return merged;

    console.log(
      `병합 완료: 총 ${merged.length}개 (신규 ${inserted}개, 변경 ${updated}개)`,
    );

    return merged.slice(merged.length - finalCount);
  }

  /**
   * 특정 마켓+타임프레임의 캔들을 Upbit에서 가져와 DB에 갱신.
   * maxPages=1: 최신 200개 (일별 cron용)
   * maxPages>1: 페이지네이션으로 더 오래된 데이터 채움 (초기 따라잡기용)
   */
  async refreshMarketCandles(
    market: string,
    timeframeUrl: UpbitCandleTimeframeUrl,
    maxPages: number = 1,
  ): Promise<void> {
    const COUNT = 200;
    let to: string | undefined = undefined;

    for (let page = 0; page < maxPages; page++) {
      const upbitRaw = await this.upbitHttpService.getCandles(market, timeframeUrl, COUNT, to);
      if (upbitRaw.length === 0) break;

      // CandleResponseDto로 변환 (오래된 순)
      const upbitCandles: CandleResponseDto[] = upbitRaw
        .slice()
        .reverse()
        .map((item) => ({
          time: this.normalizeUtcIsoString(item.candle_date_time_utc),
          open: item.opening_price,
          high: item.high_price,
          low: item.low_price,
          close: item.trade_price,
          accVolume: item.candle_acc_trade_volume,
          accPrice: item.candle_acc_trade_price,
        }));

      // DB에서 해당 범위 조회 (변경 감지용)
      const newestTime = upbitCandles[upbitCandles.length - 1].time;
      const dbCandles = await this.getCandlesFromDb(market, timeframeUrl, {
        to: newestTime,
        count: COUNT,
      });

      await this.mergeCandles(market, timeframeUrl, dbCandles, upbitCandles, COUNT);

      // 다음 페이지 커서: 이번 페이지의 가장 오래된 캔들 시간
      to = upbitCandles[0].time;

      // 200개 미만이면 히스토리 끝에 도달
      if (upbitRaw.length < COUNT) break;
    }
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

  private normalizeUtcIsoString(utc: string): string {
    // Upbit: "2025-12-04T00:00:00"
    // 이미 Z가 붙어 있으면 그대로 사용
    if (utc.endsWith('Z')) {
      return new Date(utc).toISOString();
    }

    // 'Z' 붙여서 UTC로 해석
    return new Date(utc + 'Z').toISOString();
  }
}
