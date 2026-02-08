import { Test } from '@nestjs/testing';
import { BalanceManager } from './balance.manager';
import { TradingBalance } from '../../entities/trading-balance.entity';
import Decimal from 'decimal.js-light';

describe('BalanceManager', () => {
  let manager: BalanceManager;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [BalanceManager],
    }).compile();

    manager = module.get(BalanceManager);
  });

  describe('reserve', () => {
    it('잔고 예약: available → locked', () => {
      const balance = new TradingBalance();
      balance.available = '100000';
      balance.locked = '0';

      manager.reserve(balance, new Decimal('50000'));

      expect(balance.available).toBe('50000');
      expect(balance.locked).toBe('50000');
    });

    it('잔고 부족 시 에러', () => {
      const balance = new TradingBalance();
      balance.available = '10000';
      balance.locked = '0';

      expect(() => {
        manager.reserve(balance, new Decimal('50000'));
      }).toThrow('Insufficient balance');
    });
  });

  describe('release', () => {
    it('잔고 해제 + 환불', () => {
      const balance = new TradingBalance();
      balance.available = '0';
      balance.locked = '50000';

      manager.release(
        balance,
        new Decimal('50000'), // 전부 해제
        new Decimal('34000'), // 34000 환불
      );

      expect(balance.available).toBe('34000');
      expect(balance.locked).toBe('0');
    });

    it('locked 부족 시 에러', () => {
      const balance = new TradingBalance();
      balance.available = '0';
      balance.locked = '10000';

      expect(() => {
        manager.release(balance, new Decimal('50000'), new Decimal('0'));
      }).toThrow('Locked amount insufficient');
    });
  });

  describe('increase', () => {
    it('잔고 증가', () => {
      const balance = new TradingBalance();
      balance.available = '0';
      balance.locked = '0';

      manager.increase(balance, new Decimal('1.5'));

      expect(balance.available).toBe('1.5');
    });

    it('기존 잔고에 추가', () => {
      const balance = new TradingBalance();
      balance.available = '10.5';
      balance.locked = '0';

      manager.increase(balance, new Decimal('2.3'));

      expect(balance.available).toBe('12.8');
    });
  });

  describe('decreaseLocked', () => {
    it('locked 잔고 감소', () => {
      const balance = new TradingBalance();
      balance.available = '0';
      balance.locked = '10';

      manager.decreaseLocked(balance, new Decimal('5'));

      expect(balance.locked).toBe('5');
    });

    it('locked 부족 시 에러', () => {
      const balance = new TradingBalance();
      balance.available = '0';
      balance.locked = '3';

      expect(() => {
        manager.decreaseLocked(balance, new Decimal('5'));
      }).toThrow('Locked amount insufficient');
    });
  });

  describe('restoreFromCancel', () => {
    it('주문 취소 시 복구', () => {
      const balance = new TradingBalance();
      balance.available = '50000';
      balance.locked = '50000';

      manager.restoreFromCancel(balance, new Decimal('50000'));

      expect(balance.available).toBe('100000');
      expect(balance.locked).toBe('0');
    });

    it('locked 부족 시 에러', () => {
      const balance = new TradingBalance();
      balance.available = '0';
      balance.locked = '10000';

      expect(() => {
        manager.restoreFromCancel(balance, new Decimal('50000'));
      }).toThrow('Locked amount insufficient for cancel');
    });
  });
});
