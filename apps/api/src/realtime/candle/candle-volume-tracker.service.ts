import { Injectable, Logger, OnModuleInit, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { CandleStreamService } from './candle-stream.service';
import { Candle240mFinalized } from 'src/candles/candle-240m-finalized.entity';
import { UpbitHttpService } from 'src/upbit/upbit.http.service';
import { MarketService } from 'src/market/market.service';
import { QUEUE, JOB } from 'src/queue/queue.constants';
import { filter } from 'rxjs';
import { MarketCandle } from '@chart/shared-types';

interface CurrentCandle {
  candleTime: string;
  volume: number;
  tradePrice: number; // 종가 (현재가)
  lastUpdated: Date;
}

@Injectable()
export class CandleVolumeTracker implements OnModuleInit {
  private readonly logger = new Logger(CandleVolumeTracker.name);

  private readonly MAX_FINALIZED_CACHE = 10;

  private isInitialized = false;
  private snapshotCounter = 0;
  private expectedSnapshotCount = 0;
  private snapshotTimer: NodeJS.Timeout | null = null;
  private readonly SNAPSHOT_TIMEOUT_MS = 3000; // 3초 대기

  constructor(
    @InjectRepository(Candle240mFinalized)
    private readonly finalizedRepo: Repository<Candle240mFinalized>,
    @Inject('REDIS_CLIENT')
    private readonly redis: Redis,
    @InjectQueue(QUEUE.CANDLE_RECOVERY)
    private readonly recoveryQueue: Queue,
    private readonly candleStream: CandleStreamService,
    private readonly upbitHttp: UpbitHttpService,
    private readonly marketService: MarketService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    if (!this.redis) {
      this.logger.error('❌ Redis client not available');
      return;
    }

    // MarketService 초기화 대기
    await this.waitForMarkets();

    // 환경 변수 체크
    const initEnabled =
      this.configService.get<string>('CANDLE_INIT_ENABLED', 'true') === 'true';

    if (!initEnabled) {
      this.logger.log('🛑 Candle initialization disabled - skipping REST API fetch');
    } else {
      // 핵심: REST API로 전체 마켓 초기화
      await this.initializeAllMarketsViaRest();
    }

    // 실시간 모드 활성화
    this.isInitialized = true;

    // 240분봉 스트림 구독 (실시간 업데이트만)
    this.candleStream
      .candles$()
      .pipe(filter((c) => c.type === 'candle.240m'))
      .subscribe(async (candle) => {
        try {
          await this.handleCandle240m(candle);
        } catch (error) {
          this.logger.error(`Error processing 240m candle for ${candle.code}`, error);
        }
      });
  }

  /**
   * MarketService 초기화 대기
   */
  private async waitForMarkets() {
    let retries = 0;
    const maxRetries = 10;

    while (retries < maxRetries) {
      const markets = this.marketService.getAll();
      if (markets.length > 0) {
        this.logger.log(`✅ Markets loaded: ${markets.length} markets`);
        return;
      }

      this.logger.warn(
        `⏳ Waiting for markets to load... (${retries + 1}/${maxRetries})`,
      );
      await new Promise((resolve) => setTimeout(resolve, 500));
      retries++;
    }

    throw new Error('Failed to load markets after 10 retries');
  }

  /**
   * 스냅샷 추적 초기화 (재구독 시에도 호출 가능)
   */
  private initializeSnapshotTracking() {
    const markets = this.marketService.getAll();
    this.expectedSnapshotCount = Math.max(markets.length, 1); // 최소 1

    this.logger.log(
      `✅ CandleVolumeTracker initialized - expecting ${this.expectedSnapshotCount} snapshots...`,
    );

    // 재구독 시 리셋
    if (this.snapshotCounter > 0) {
      this.logger.log('🔄 Resetting snapshot tracking for resubscription');
      this.isInitialized = false;
      this.snapshotCounter = 0;
    }
  }

  /**
   * 스냅샷 카운터 증가 및 완료 체크
   */
  private incrementSnapshotCounter() {
    this.snapshotCounter++;

    // 기존 타이머 취소
    if (this.snapshotTimer) {
      clearTimeout(this.snapshotTimer);
    }

    // 새 타이머 설정: 3초 동안 메시지 없으면 스냅샷 완료로 간주
    this.snapshotTimer = setTimeout(() => {
      if (!this.isInitialized) {
        this.isInitialized = true;
        this.logger.log(
          `✅ Snapshot timeout reached - processed ${this.snapshotCounter} markets (expected ${this.expectedSnapshotCount}) - switching to realtime mode`,
        );

        // 나머지 마켓은 REST API로 초기화
        this.initializeRemainingMarkets();
      }
    }, this.SNAPSHOT_TIMEOUT_MS);

    // 모든 스냅샷 수신 시 즉시 완료
    if (this.snapshotCounter >= this.expectedSnapshotCount) {
      if (this.snapshotTimer) {
        clearTimeout(this.snapshotTimer);
        this.snapshotTimer = null;
      }
      this.isInitialized = true;
      this.logger.log(
        `✅ All snapshots processed (${this.snapshotCounter}/${this.expectedSnapshotCount}) - switching to realtime mode`,
      );
    }
  }

  /**
   * 웹소켓 재구독 시 호출 (RealtimeBootstrapService에서)
   */
  public resetForResubscription() {
    this.logger.log('🔄 Resetting tracker for websocket resubscription');

    // 타이머 취소
    if (this.snapshotTimer) {
      clearTimeout(this.snapshotTimer);
      this.snapshotTimer = null;
    }

    this.isInitialized = false;
    this.snapshotCounter = 0;
    this.initializeSnapshotTracking();
  }

  /**
   * 전체 마켓 초기화 (REST API 사용)
   */
  private async initializeAllMarketsViaRest() {
    try {
      const allMarkets = this.marketService.getAll();

      this.logger.log(`🔄 Initializing all ${allMarkets.length} markets via REST API...`);

      let successCount = 0;
      let skipCount = 0;

      // REST API로 각 마켓의 최신 240분봉 조회
      for (const marketInfo of allMarkets) {
        try {
          const candles = await this.upbitHttp.getCandles(marketInfo.code, '240m', 1);

          if (candles.length > 0) {
            const c = candles[0];
            const normalizedTime = this.normalizeISOString(c.candle_date_time_utc);

            await this.redis.set(
              `candle:240m:${marketInfo.code}:current`,
              JSON.stringify({
                candleTime: normalizedTime,
                volume: c.candle_acc_trade_volume || 0,
                tradePrice: c.trade_price || 0,
                lastUpdated: new Date().toISOString(),
              }),
              'EX',
              48 * 3600,
            );

            await this.redis.set(
              `candle:240m:${marketInfo.code}:last-time`,
              normalizedTime,
              'EX',
              48 * 3600,
            );

            successCount++;
          } else {
            skipCount++;
            this.logger.verbose(
              `⚠️ No 240m candle data for ${marketInfo.code} - skipping`,
            );
          }
        } catch (error) {
          this.logger.warn(
            `⚠️ Failed to initialize ${marketInfo.code} via REST API`,
            error.message,
          );
        }

        // Rate limiting: 100ms 대기
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      this.logger.log(
        `✅ REST API initialization completed - Success: ${successCount}, Skipped: ${skipCount}, Total: ${allMarkets.length}`,
      );
    } catch (error) {
      this.logger.error('Failed to initialize all markets via REST API', error);
      throw error;
    }
  }

  /**
   * 나머지 마켓 초기화 (REST API 사용) - DEPRECATED
   */
  private async initializeRemainingMarkets() {
    try {
      const allMarkets = this.marketService.getAll();
      const redisKeys = await this.redis.keys('candle:240m:*:current');
      const existingMarkets = redisKeys.map((key: string) => key.split(':')[2]);

      const missingMarkets = allMarkets.filter((m) => !existingMarkets.includes(m.code));

      if (missingMarkets.length === 0) {
        this.logger.log(`✅ No missing markets - all initialized`);
        return;
      }

      this.logger.log(
        `🔄 Initializing ${missingMarkets.length} remaining markets via REST API...`,
      );

      // REST API로 각 마켓의 최신 240분봉 조회
      for (const marketInfo of missingMarkets) {
        try {
          const candles = await this.upbitHttp.getCandles(marketInfo.code, '240m', 1);

          if (candles.length > 0) {
            const c = candles[0];
            const normalizedTime = this.normalizeISOString(c.candle_date_time_utc);

            await this.redis.set(
              `candle:240m:${marketInfo.code}:current`,
              JSON.stringify({
                candleTime: normalizedTime,
                volume: c.candle_acc_trade_volume || 0,
                tradePrice: c.trade_price || 0,
                lastUpdated: new Date().toISOString(),
              }),
              'EX',
              48 * 3600,
            );

            await this.redis.set(
              `candle:240m:${marketInfo.code}:last-time`,
              normalizedTime,
              'EX',
              48 * 3600,
            );

            this.logger.verbose(`✅ Initialized ${marketInfo.code} via REST API`);
          } else {
            this.logger.verbose(
              `⚠️ No 240m candle data for ${marketInfo.code} - skipping`,
            );
          }
        } catch (error) {
          this.logger.warn(
            `⚠️ Failed to initialize ${marketInfo.code} via REST API`,
            error.message,
          );
        }

        // Rate limiting: 100ms 대기
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      this.logger.log(
        `✅ REST API initialization completed - total markets: ${allMarkets.length}`,
      );
    } catch (error) {
      this.logger.error('Failed to initialize remaining markets', error);
    }
  }

  /**
   * 스냅샷 처리 (웹소켓 연결 시 최초 데이터)
   */
  private async handleSnapshot(snapshot: MarketCandle) {
    const market = snapshot.code;
    // ISO string 정규화 (일관성 유지!)
    const snapshotTime = this.normalizeISOString(snapshot.candleDateTimeUtc);

    // 데이터 검증
    if (!snapshot.candleAccTradeVolume || !snapshot.tradePrice) {
      this.logger.warn(
        `⚠️ Snapshot data incomplete for ${market}: volume=${snapshot.candleAccTradeVolume}, price=${snapshot.tradePrice}`,
      );
      // 데이터가 없어도 계속 진행 (기본값 0 사용)
    }

    // Redis에서 마지막 추적 시간 조회
    const lastTime = await this.redis.get(`candle:240m:${market}:last-time`);

    if (!lastTime) {
      // 최초 시작 - 스냅샷을 현재 봉으로 저장
      await this.saveCurrentCandle(market, snapshot);
      this.logger.verbose(`📸 Initial snapshot saved: ${market}`);
      return;
    }

    // 봉 경계가 바뀌었는지 확인
    if (lastTime !== snapshotTime) {
      this.logger.warn(
        `⚠️ Candle boundary changed for ${market}: ${lastTime} → ${snapshotTime}`,
      );

      // 복구 Job 큐에 추가 (즉시 복구하지 않음)
      await this.recoveryQueue.add(
        JOB.RECOVER_MISSING_CANDLES,
        {
          market,
          lastTime,
          currentTime: snapshotTime,
        },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
          removeOnComplete: true,
          removeOnFail: false,
        },
      );

      this.logger.verbose(`📋 Recovery job added to queue: ${market}`);
    }

    // 스냅샷을 현재 봉으로 저장
    await this.saveCurrentCandle(market, snapshot);
  }

  /**
   * 현재 봉 Redis 저장
   */
  private async saveCurrentCandle(market: string, candle: MarketCandle) {
    try {
      // ISO string 정규화 (Z가 없으면 추가)
      const normalizedTime = this.normalizeISOString(candle.candleDateTimeUtc);

      await this.redis.set(
        `candle:240m:${market}:current`,
        JSON.stringify({
          candleTime: normalizedTime,
          volume: candle.candleAccTradeVolume || 0,
          tradePrice: candle.tradePrice || 0, // 종가 (현재가)
          lastUpdated: new Date().toISOString(),
        }),
        'EX',
        48 * 3600,
      );

      await this.redis.set(
        `candle:240m:${market}:last-time`,
        normalizedTime,
        'EX',
        48 * 3600,
      );
    } catch (error) {
      this.logger.error(`Failed to save current candle to Redis: ${market}`, error);
      throw error; // 에러를 상위로 전파
    }
  }

  /**
   * ISO string 정규화 (Z가 없으면 추가)
   */
  private normalizeISOString(dateStr: string): string {
    if (!dateStr) return dateStr;
    // 이미 Z나 타임존 정보가 있으면 그대로
    if (
      dateStr.endsWith('Z') ||
      dateStr.includes('+') ||
      dateStr.match(/[+-]\d{2}:\d{2}$/)
    ) {
      return dateStr;
    }
    // UTC로 간주하고 Z 추가
    return dateStr + 'Z';
  }

  /**
   * 누락된 봉 복구 (public - Processor에서 호출)
   */
  async recoverMissingCandles(market: string, lastTime: string, currentTime: string) {
    try {
      // 1. Redis에 마지막으로 저장된 진행중 봉 확정
      const lastCurrentStr = await this.redis.get(`candle:240m:${market}:current`);
      if (lastCurrentStr) {
        // REST API로 정확한 값 fetch
        const accurate = await this.upbitHttp.getCandles(market, '240m', 1);
        if (accurate[0]?.candle_date_time_utc === lastTime) {
          await this.finalizeCandle(market, {
            candleTime: lastTime,
            volume: accurate[0].candle_acc_trade_volume,
            tradePrice: accurate[0].trade_price, // 종가
            lastUpdated: new Date(),
          });

          this.logger.log(`✅ Recovered last candle: ${market} @ ${lastTime}`);
        }
      }

      // 2. 중간에 누락된 봉 확인
      const gap = this.calculateCandleGap(lastTime, currentTime);
      if (gap > 1) {
        this.logger.warn(`⚠️ Gap detected for ${market}: ${gap} candles missing`);

        // 여러 봉 건너뜀 → REST API로 전부 fetch
        const candles = await this.upbitHttp.getCandles(market, '240m', gap);

        for (const c of candles) {
          const cTime = c.candle_date_time_utc;

          // lastTime과 currentTime 사이의 봉만 확정
          if (cTime > lastTime && cTime < currentTime) {
            await this.finalizeCandle(market, {
              candleTime: cTime,
              volume: c.candle_acc_trade_volume,
              tradePrice: c.trade_price, // 종가
              lastUpdated: new Date(),
            });

            this.logger.verbose(`✅ Recovered gap candle: ${market} @ ${cTime}`);
          }
        }
      }
    } catch (error) {
      this.logger.error(`Failed to recover missing candles for ${market}`, error);
    }
  }

  /**
   * 봉 간격 계산 (240분 = 4시간 단위)
   */
  private calculateCandleGap(fromTime: string, toTime: string): number {
    const from = new Date(fromTime).getTime();
    const to = new Date(toTime).getTime();
    const diffMs = to - from;
    const diffHours = diffMs / (1000 * 60 * 60);
    return Math.floor(diffHours / 4); // 4시간 = 1봉
  }

  /**
   * 240분봉 수신 처리
   */
  private async handleCandle240m(candle: MarketCandle) {
    const market = candle.code;
    const candleTime = this.normalizeISOString(candle.candleDateTimeUtc); // ISO string 정규화
    const volume = candle.candleAccTradeVolume;
    const tradePrice = candle.tradePrice; // 종가

    // Redis에서 마지막 추적 시간 조회
    const lastTime = await this.redis.get(`candle:240m:${market}:last-time`);

    // 봉 경계 감지 (정규화된 시간으로 비교)
    if (lastTime && lastTime !== candleTime) {
      // 이전 봉 확정
      const prevCandleStr = await this.redis.get(`candle:240m:${market}:current`);
      if (prevCandleStr) {
        const prevCandle = JSON.parse(prevCandleStr);
        await this.finalizeCandle(market, prevCandle);
        this.logger.verbose(
          `📊 Finalized 240m candle: ${market} @ ${prevCandle.candleTime}`,
        );
      }
    }

    // 현재 봉 Redis 저장
    await this.redis.set(
      `candle:240m:${market}:current`,
      JSON.stringify({
        candleTime,
        volume,
        tradePrice,
        lastUpdated: new Date().toISOString(),
      }),
      'EX',
      48 * 3600, // TTL: 48시간
    );

    await this.redis.set(`candle:240m:${market}:last-time`, candleTime, 'EX', 48 * 3600);
  }

  /**
   * 봉 확정 처리 (DB + Redis 캐시)
   */
  private async finalizeCandle(market: string, candle: CurrentCandle) {
    try {
      const enabled =
        this.configService.get<string>('CANDLE_DB_WRITE_ENABLED', 'true') === 'true';

      // 로컬에서는 DB 저장 스킵 (배포 환경과 충돌 방지)
      if (!enabled) {
        this.logger.verbose(
          `💡 [DEV] Skipping DB save for ${market} @ ${candle.candleTime} (dev mode)`,
        );
      } else {
        // 0. 중복 확인 (이미 확정된 봉인지 체크)
        const existing = await this.finalizedRepo.findOne({
          where: {
            market,
            candleTime: new Date(candle.candleTime),
          },
        });

        if (existing) {
          this.logger.verbose(
            `⏭️ Skipping duplicate finalized candle: ${market} @ ${candle.candleTime}`,
          );
          return; // 이미 존재하면 스킵
        }

        // 1. DB 저장
        await this.finalizedRepo.save({
          market,
          candleTime: new Date(candle.candleTime),
          accVolume: String(candle.volume),
          accPrice: String(candle.tradePrice), // 종가 저장
          finalizedAt: new Date(),
        });
      }

      // 2. Redis Sorted Set 추가 (시간 순 정렬)
      const score = new Date(candle.candleTime).getTime();

      await this.redis.zadd(
        `candle:240m:${market}:finalized`,
        score,
        JSON.stringify({
          candleTime: candle.candleTime,
          volume: candle.volume,
          tradePrice: candle.tradePrice,
          finalizedAt: new Date().toISOString(),
        }),
      );

      // 3. 오래된 봉 제거 (최근 10개만 유지)
      await this.redis.zremrangebyrank(
        `candle:240m:${market}:finalized`,
        0,
        -this.MAX_FINALIZED_CACHE - 1,
      );

      // 4. TTL 설정
      await this.redis.expire(`candle:240m:${market}:finalized`, 48 * 3600);
    } catch (error) {
      this.logger.error(
        `Failed to finalize candle: ${market} @ ${candle.candleTime}`,
        error,
      );
    }
  }

  /**
   * 일봉 거래량 조회
   * @returns volume: 하루 누적 거래량, currentPrice: 최신 종가
   */
  async getDailyVolume(
    market: string,
  ): Promise<{ volume: number; currentPrice: number }> {
    const todayStart = this.getTodayStartUTC();
    const todayStartTimestamp = todayStart.getTime();

    // Redis Sorted Set에서 오늘 확정 봉들 조회
    const finalizedStrs = await this.redis.zrangebyscore(
      `candle:240m:${market}:finalized`,
      todayStartTimestamp,
      '+inf',
    );

    // 확정 봉 거래량 합산
    let totalVolume = 0;
    let latestPrice = 0;

    for (const str of finalizedStrs) {
      const candle = JSON.parse(str);
      totalVolume += candle.volume;
      latestPrice = candle.tradePrice; // 가장 최근 확정 봉의 종가
    }

    // 현재 진행중 봉 추가
    const currentStr = await this.redis.get(`candle:240m:${market}:current`);
    if (currentStr) {
      const current = JSON.parse(currentStr);
      // ISO string 정규화 후 비교
      const currentTimestamp = new Date(
        this.normalizeISOString(current.candleTime),
      ).getTime();
      if (currentTimestamp >= todayStartTimestamp) {
        totalVolume += current.volume;
        latestPrice = current.tradePrice; // 현재 봉의 종가 (가장 최신)
      }
    }

    return { volume: totalVolume, currentPrice: latestPrice };
  }

  /**
   * 오늘 시작 시간 (KST 09:00 → UTC 00:00)
   *
   * 예시:
   * - 2026-02-08 10:00 KST (01:00 UTC) → 2026-02-07 00:00 UTC
   * - 2026-02-08 09:00 KST (00:00 UTC) → 2026-02-08 00:00 UTC
   */
  private getTodayStartUTC(): Date {
    const now = new Date();

    // 현재 UTC 시간을 밀리초로
    const nowUtcMs = now.getTime();

    // UTC를 KST로 변환 (UTC + 9시간)
    const kstOffsetMs = 9 * 3600 * 1000;
    const nowKstMs = nowUtcMs + kstOffsetMs;

    // KST 기준 날짜 정보 추출
    const kstDate = new Date(nowKstMs);
    const kstYear = kstDate.getUTCFullYear();
    const kstMonth = kstDate.getUTCMonth();
    const kstDay = kstDate.getUTCDate();
    const kstHour = kstDate.getUTCHours();

    // KST 기준 09:00 이전이면 전날
    let targetDay = kstDay;
    if (kstHour < 9) {
      targetDay -= 1;
    }

    // KST 기준 목표 날짜의 09:00 (= UTC 00:00)
    const kstTargetMs = Date.UTC(kstYear, kstMonth, targetDay, 9, 0, 0, 0);

    // KST 09:00 → UTC 00:00 변환
    const utcTargetMs = kstTargetMs - kstOffsetMs;

    return new Date(utcTargetMs);
  }

  /**
   * 상태 조회 (디버깅용)
   */
  async getStatus() {
    // Redis에서 현재 봉 키 목록 조회
    const currentKeys = await this.redis.keys('candle:240m:*:current');
    const markets = currentKeys.map((key: string) => key.split(':')[2]).slice(0, 10);

    return {
      isInitialized: this.isInitialized,
      snapshotProgress: `${this.snapshotCounter}/${this.expectedSnapshotCount}`,
      currentCandles: currentKeys.length,
      redisConnected: !!this.redis,
      markets,
    };
  }

  /**
   * 누락된 마켓 목록 조회
   */
  async getMissingMarkets() {
    try {
      const allMarkets = this.marketService.getAll();
      const redisKeys = await this.redis.keys('candle:240m:*:current');
      const existingMarkets = redisKeys.map((key: string) => key.split(':')[2]);

      const missingMarkets = allMarkets
        .filter((m) => !existingMarkets.includes(m.code))
        .map((m) => m.code);

      return {
        total: allMarkets.length,
        existing: existingMarkets.length,
        missing: missingMarkets.length,
        missingMarkets,
        isInitialized: this.isInitialized,
        snapshotCounter: this.snapshotCounter,
        expectedSnapshotCount: this.expectedSnapshotCount,
      };
    } catch (error) {
      this.logger.error('Failed to get missing markets', error);
      throw error;
    }
  }

  /**
   * 일봉 거래량 디버깅 (상세 정보)
   */
  async debugDailyVolume(market: string) {
    const todayStart = this.getTodayStartUTC();
    const todayStartTimestamp = todayStart.getTime();
    const now = new Date();

    // 현재 봉 조회
    const currentStr = await this.redis.get(`candle:240m:${market}:current`);
    const current = currentStr ? JSON.parse(currentStr) : null;

    // 확정 봉들 조회
    const finalizedStrs = await this.redis.zrangebyscore(
      `candle:240m:${market}:finalized`,
      todayStartTimestamp,
      '+inf',
    );

    const finalizedCandles = finalizedStrs.map((str) => JSON.parse(str));

    // 모든 확정 봉 조회 (시간 무관)
    const allFinalizedStrs = await this.redis.zrange(
      `candle:240m:${market}:finalized`,
      0,
      -1,
    );
    const allFinalized = allFinalizedStrs.map((str) => JSON.parse(str));

    // 현재 봉 타임스탬프 계산 (정규화 적용)
    const currentTimestamp = current
      ? new Date(this.normalizeISOString(current.candleTime)).getTime()
      : 0;

    return {
      market,
      now: now.toISOString(),
      todayStartUTC: todayStart.toISOString(),
      todayStartTimestamp,
      current: current
        ? {
            candleTime: current.candleTime,
            candleTimeNormalized: this.normalizeISOString(current.candleTime),
            candleTimeTimestamp: currentTimestamp,
            volume: current.volume,
            tradePrice: current.tradePrice,
            isToday: currentTimestamp >= todayStartTimestamp,
          }
        : null,
      finalizedToday: {
        count: finalizedCandles.length,
        candles: finalizedCandles,
      },
      allFinalized: {
        count: allFinalized.length,
        candles: allFinalized,
      },
    };
  }
}
