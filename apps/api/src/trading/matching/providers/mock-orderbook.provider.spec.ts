import { MockOrderbookProvider } from './mock-orderbook.provider';

describe('MockOrderbookProvider', () => {
  let provider: MockOrderbookProvider;

  beforeEach(() => {
    provider = new MockOrderbookProvider();
  });

  describe('기본 Fixture 로드', () => {
    it('BTC 호가창 기본 데이터 있음', () => {
      const orderbook = provider.getSnapshotByCode('KRW-BTC');

      expect(orderbook).toBeDefined();
      expect(orderbook?.code).toBe('KRW-BTC');
      expect(orderbook?.units).toHaveLength(2);
      expect(orderbook?.units[0].askPrice).toBe(100_000_000);
      expect(orderbook?.units[0].bidPrice).toBe(99_900_000);
    });

    it('ETH 호가창 기본 데이터 있음', () => {
      const orderbook = provider.getSnapshotByCode('KRW-ETH');

      expect(orderbook).toBeDefined();
      expect(orderbook?.code).toBe('KRW-ETH');
      expect(orderbook?.units[0].askPrice).toBe(5_000_000);
      expect(orderbook?.units[0].bidPrice).toBe(4_990_000);
    });

    it('DOGE 호가창 기본 데이터 있음', () => {
      const orderbook = provider.getSnapshotByCode('KRW-DOGE');

      expect(orderbook).toBeDefined();
      expect(orderbook?.code).toBe('KRW-DOGE');
      expect(orderbook?.units[0].askPrice).toBe(180);
      expect(orderbook?.units[0].bidPrice).toBe(179);
    });
  });

  describe('setSimple - 간편 설정', () => {
    it('호가창 새로 설정 가능', () => {
      provider.setSimple('KRW-SOL', 200_000, 199_000, 50, 50);

      const orderbook = provider.getSnapshotByCode('KRW-SOL');

      expect(orderbook).toBeDefined();
      expect(orderbook?.code).toBe('KRW-SOL');
      expect(orderbook?.units[0].askPrice).toBe(200_000);
      expect(orderbook?.units[0].bidPrice).toBe(199_000);
      expect(orderbook?.units[0].askSize).toBe(50);
      expect(orderbook?.units[0].bidSize).toBe(50);
    });

    it('기존 호가창 덮어쓰기 가능', () => {
      // Given: BTC 초기값
      let orderbook = provider.getSnapshotByCode('KRW-BTC');
      expect(orderbook?.units[0].askPrice).toBe(100_000_000);

      // When: 호가 변경
      provider.setSimple('KRW-BTC', 120_000_000, 119_000_000, 5, 5);

      // Then: 변경 확인
      orderbook = provider.getSnapshotByCode('KRW-BTC');
      expect(orderbook?.units[0].askPrice).toBe(120_000_000);
      expect(orderbook?.units[0].bidPrice).toBe(119_000_000);
    });
  });

  describe('setSnapshot - 상세 설정', () => {
    it('복잡한 호가창 설정 가능', () => {
      provider.setSnapshot('KRW-ADA', {
        code: 'KRW-ADA',
        totalAskSize: 1000,
        totalBidSize: 1000,
        units: [
          { askPrice: 500, bidPrice: 499, askSize: 100, bidSize: 100 },
          { askPrice: 501, bidPrice: 498, askSize: 200, bidSize: 200 },
          { askPrice: 502, bidPrice: 497, askSize: 300, bidSize: 300 },
        ],
        timestamp: Date.now(),
        level: 0,
        streamType: 'REALTIME',
      });

      const orderbook = provider.getSnapshotByCode('KRW-ADA');

      expect(orderbook?.units).toHaveLength(3);
      expect(orderbook?.totalAskSize).toBe(1000);
    });
  });

  describe('remove & clear', () => {
    it('특정 호가창 제거', () => {
      provider.remove('KRW-BTC');

      const orderbook = provider.getSnapshotByCode('KRW-BTC');
      expect(orderbook).toBeUndefined();
    });

    it('모든 호가창 제거', () => {
      provider.clear();

      expect(provider.getSnapshotByCode('KRW-BTC')).toBeUndefined();
      expect(provider.getSnapshotByCode('KRW-ETH')).toBeUndefined();
      expect(provider.getSnapshotByCode('KRW-DOGE')).toBeUndefined();
    });
  });

  describe('대소문자 정규화', () => {
    it('소문자 입력도 작동', () => {
      const orderbook = provider.getSnapshotByCode('krw-btc');

      expect(orderbook).toBeDefined();
      expect(orderbook?.code).toBe('KRW-BTC');
    });

    it('혼합 케이스도 작동', () => {
      const orderbook = provider.getSnapshotByCode('krW-BtC');

      expect(orderbook).toBeDefined();
    });
  });

  describe('결정적 테스트 시나리오', () => {
    it('시나리오 1: 호가 변동에 따른 체결 가능 여부', () => {
      // 초기: 체결 불가능 (매수 가격 < 매도 호가)
      provider.setSimple('KRW-TEST', 100_000, 99_000, 10, 10);

      let orderbook = provider.getSnapshotByCode('KRW-TEST')!;
      const buyPrice = 98_000;

      expect(buyPrice < orderbook.units[0].askPrice).toBe(true); // 체결 불가

      // 호가 하락: 체결 가능
      provider.setSimple('KRW-TEST', 95_000, 94_000, 10, 10);

      orderbook = provider.getSnapshotByCode('KRW-TEST')!;
      expect(buyPrice > orderbook.units[0].askPrice).toBe(true); // 체결 가능
    });

    it('시나리오 2: 수량 변경에 따른 부분 체결', () => {
      // 충분한 수량
      provider.setSimple('KRW-TEST', 100_000, 99_000, 100, 100);

      let orderbook = provider.getSnapshotByCode('KRW-TEST')!;
      expect(orderbook.units[0].askSize).toBe(100);

      // 수량 감소 → 부분 체결 필요
      provider.setSimple('KRW-TEST', 100_000, 99_000, 10, 100);

      orderbook = provider.getSnapshotByCode('KRW-TEST')!;
      expect(orderbook.units[0].askSize).toBe(10);
    });
  });
});
