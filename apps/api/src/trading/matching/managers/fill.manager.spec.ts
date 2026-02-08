import { Test } from '@nestjs/testing';
import { FillManager } from './fill.manager';
import Decimal from 'decimal.js-light';

describe('FillManager', () => {
  let manager: FillManager;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [FillManager],
    }).compile();

    manager = module.get(FillManager);
  });

  describe('create', () => {
    it('매수 체결내역 생성', () => {
      const fill = manager.create({
        orderId: 'order-123',
        userId: 'user-1',
        market: 'KRW-BTC',
        side: 'BUY',
        price: new Decimal('160'),
        qty: new Decimal('1.5'),
      });

      expect(fill.orderId).toBe('order-123');
      expect(fill.userId).toBe('user-1');
      expect(fill.market).toBe('KRW-BTC');
      expect(fill.side).toBe('BUY');
      expect(fill.price).toBe('160');
      expect(fill.qty).toBe('1.5');
    });

    it('매도 체결내역 생성', () => {
      const fill = manager.create({
        orderId: 'order-456',
        userId: 'user-2',
        market: 'KRW-DOGE',
        side: 'SELL',
        price: new Decimal('180'),
        qty: new Decimal('1000'),
      });

      expect(fill.side).toBe('SELL');
      expect(fill.price).toBe('180');
      expect(fill.qty).toBe('1000');
    });
  });
});
