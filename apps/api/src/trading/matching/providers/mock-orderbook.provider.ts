import { Injectable, Logger } from '@nestjs/common';
import { MarketOrderbook } from '@chart/shared-types';
import { IOrderbookProvider } from './orderbook-provider.interface';

/**
 * 테스트용 고정 호가창 제공자
 * - 메모리 Map에 테스트 데이터 저장
 * - 테스트 중 동적으로 호가창 변경 가능
 */
@Injectable()
export class MockOrderbookProvider implements IOrderbookProvider {
  private readonly logger = new Logger(MockOrderbookProvider.name);
  private readonly fixtures = new Map<string, MarketOrderbook>();

  constructor() {
    // 기본 테스트 데이터 로드
    this.loadDefaultFixtures();
  }

  getSnapshotByCode(code: string): MarketOrderbook | undefined {
    const normalized = code.toUpperCase();
    return this.fixtures.get(normalized);
  }

  /**
   * 테스트에서 호가창 동적 설정
   * @example
   * mockProvider.setSnapshot('KRW-BTC', {
   *   code: 'KRW-BTC',
   *   units: [...]
   * })
   */
  setSnapshot(code: string, orderbook: MarketOrderbook): void {
    const normalized = code.toUpperCase();
    this.fixtures.set(normalized, orderbook);
    this.logger.debug(`📝 Mock orderbook set: ${normalized}`);
  }

  /**
   * 간편 호가창 생성 헬퍼
   * @example
   * mockProvider.setSimple('KRW-BTC', 100000, 99000, 10, 10)
   */
  setSimple(
    code: string,
    askPrice: number,
    bidPrice: number,
    askSize: number,
    bidSize: number,
  ): void {
    const normalized = code.toUpperCase();

    this.fixtures.set(normalized, {
      code: normalized,
      totalAskSize: askSize,
      totalBidSize: bidSize,
      units: [
        {
          askPrice,
          bidPrice,
          askSize,
          bidSize,
        },
      ],
      timestamp: Date.now(),
      level: 0,
      streamType: 'REALTIME',
    });

    this.logger.debug(
      `📝 Simple orderbook set: ${normalized} (ask=${askPrice}, bid=${bidPrice})`,
    );
  }

  /**
   * 특정 마켓의 호가창 제거
   */
  remove(code: string): void {
    const normalized = code.toUpperCase();
    this.fixtures.delete(normalized);
    this.logger.debug(`🗑️ Mock orderbook removed: ${normalized}`);
  }

  /**
   * 모든 호가창 제거
   */
  clear(): void {
    this.fixtures.clear();
    this.logger.debug('🗑️ All mock orderbooks cleared');
  }

  /**
   * 기본 테스트 데이터 로드
   */
  private loadDefaultFixtures(): void {
    // KRW-BTC: 매수 체결 가능
    this.fixtures.set('KRW-BTC', {
      code: 'KRW-BTC',
      totalAskSize: 10,
      totalBidSize: 10,
      units: [
        {
          askPrice: 100_000_000, // 1억
          bidPrice: 99_900_000, // 9990만
          askSize: 5,
          bidSize: 5,
        },
        {
          askPrice: 100_100_000,
          bidPrice: 99_800_000,
          askSize: 5,
          bidSize: 5,
        },
      ],
      timestamp: Date.now(),
      level: 0,
      streamType: 'REALTIME',
    });

    // KRW-ETH: 소액 거래
    this.fixtures.set('KRW-ETH', {
      code: 'KRW-ETH',
      totalAskSize: 20,
      totalBidSize: 20,
      units: [
        {
          askPrice: 5_000_000, // 500만
          bidPrice: 4_990_000, // 499만
          askSize: 10,
          bidSize: 10,
        },
        {
          askPrice: 5_010_000,
          bidPrice: 4_980_000,
          askSize: 10,
          bidSize: 10,
        },
      ],
      timestamp: Date.now(),
      level: 0,
      streamType: 'REALTIME',
    });

    // KRW-DOGE: 소액 코인
    this.fixtures.set('KRW-DOGE', {
      code: 'KRW-DOGE',
      totalAskSize: 1000,
      totalBidSize: 1000,
      units: [
        {
          askPrice: 180,
          bidPrice: 179,
          askSize: 500,
          bidSize: 500,
        },
        {
          askPrice: 181,
          bidPrice: 178,
          askSize: 500,
          bidSize: 500,
        },
      ],
      timestamp: Date.now(),
      level: 0,
      streamType: 'REALTIME',
    });

    this.logger.log('✅ Default mock orderbooks loaded (BTC, ETH, DOGE)');
  }
}
