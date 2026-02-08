import { PositionCalculator } from './position.calculator';
import Decimal from 'decimal.js-light';
import { PositionSnapshot } from '../types/execution.types';

describe('PositionCalculator', () => {
  let calculator: PositionCalculator;

  beforeEach(() => {
    calculator = new PositionCalculator();
  });

  describe('applyBuy', () => {
    it('첫 매수: 평단 = 매수가', () => {
      const current: PositionSnapshot = {
        qty: new Decimal('0'),
        avgPrice: new Decimal('0'),
        cost: new Decimal('0'),
        realizedPnl: new Decimal('0'),
      };

      const result = calculator.applyBuy(current, new Decimal('150'), new Decimal('100'));

      expect(result.qty.toString()).toBe('100');
      expect(result.avgPrice.toString()).toBe('150');
      expect(result.cost.toString()).toBe('15000');
    });

    it('추가 매수: 평단 재계산', () => {
      const current: PositionSnapshot = {
        qty: new Decimal('100'),
        avgPrice: new Decimal('150'),
        cost: new Decimal('15000'),
        realizedPnl: new Decimal('0'),
      };

      const result = calculator.applyBuy(current, new Decimal('200'), new Decimal('50'));

      expect(result.qty.toString()).toBe('150');
      expect(result.cost.toString()).toBe('25000'); // 15000 + 10000

      // ✅ 소수점 비교 수정: toFixed로 반올림 또는 근사값 비교
      const expectedAvg = new Decimal('25000').div(new Decimal('150'));
      expect(result.avgPrice.toFixed(2)).toBe(expectedAvg.toFixed(2)); // 166.67

      // 또는 정확한 값으로 비교
      expect(result.avgPrice.toString()).toBe('166.66666666666666666'); // ✅ 실제 값
    });
  });

  describe('applySell', () => {
    it('부분 매도: 실현손익 계산', () => {
      const current: PositionSnapshot = {
        qty: new Decimal('100'),
        avgPrice: new Decimal('150'),
        cost: new Decimal('15000'),
        realizedPnl: new Decimal('0'),
      };

      const result = calculator.applySell(current, new Decimal('200'), new Decimal('50'));

      expect(result.qty.toString()).toBe('50');
      expect(result.avgPrice.toString()).toBe('150'); // 평단 유지
      expect(result.cost.toString()).toBe('7500'); // 150 * 50
      expect(result.realizedPnl.toString()).toBe('2500'); // (200-150) * 50
    });

    it('전량 매도: 포지션 초기화', () => {
      const current: PositionSnapshot = {
        qty: new Decimal('100'),
        avgPrice: new Decimal('150'),
        cost: new Decimal('15000'),
        realizedPnl: new Decimal('0'),
      };

      const result = calculator.applySell(
        current,
        new Decimal('200'),
        new Decimal('100'),
      );

      expect(result.qty.toString()).toBe('0');
      expect(result.avgPrice.toString()).toBe('0');
      expect(result.cost.toString()).toBe('0');
      expect(result.realizedPnl.toString()).toBe('5000'); // (200-150) * 100
    });

    it('손실 매도: 음수 실현손익', () => {
      const current: PositionSnapshot = {
        qty: new Decimal('100'),
        avgPrice: new Decimal('150'),
        cost: new Decimal('15000'),
        realizedPnl: new Decimal('0'),
      };

      const result = calculator.applySell(
        current,
        new Decimal('100'), // 손실
        new Decimal('50'),
      );

      expect(result.realizedPnl.toString()).toBe('-2500'); // (100-150) * 50
    });
  });
});
