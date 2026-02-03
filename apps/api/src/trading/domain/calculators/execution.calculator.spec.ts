import { ExecutionCalculator } from './execution.calculator';
import Decimal from 'decimal.js-light';

describe('SettlementCalculator', () => {
  let calculator: ExecutionCalculator;

  beforeEach(() => {
    calculator = new ExecutionCalculator();
  });

  describe('calculateBuySettlement', () => {
    it('지정가 매수: 차액 환불 계산', () => {
      const result = calculator.calculateBuyExecution({
        orderPrice: new Decimal('500'),
        fillPrice: new Decimal('160'),
        fillQty: new Decimal('100'),
        orderType: 'LIMIT',
      });

      expect(result.actualSpend.toString()).toBe('16000'); // 160 * 100
      expect(result.lockedAmount.toString()).toBe('50000'); // 500 * 100
      expect(result.refund.toString()).toBe('34000'); // 50000 - 16000
    });

    it('시장가 매수: 환불 없음', () => {
      const result = calculator.calculateBuyExecution({
        orderPrice: new Decimal('0'), // 시장가는 무시됨
        fillPrice: new Decimal('160'),
        fillQty: new Decimal('100'),
        orderType: 'MARKET',
      });

      expect(result.actualSpend.toString()).toBe('16000');
      expect(result.lockedAmount.toString()).toBe('16000');
      expect(result.refund.toString()).toBe('0');
    });

    it('호가가 지정가와 같을 때: 환불 0', () => {
      const result = calculator.calculateBuyExecution({
        orderPrice: new Decimal('160'),
        fillPrice: new Decimal('160'),
        fillQty: new Decimal('100'),
        orderType: 'LIMIT',
      });

      expect(result.refund.toString()).toBe('0');
    });
  });

  describe('calculateSellSettlement', () => {
    it('매도 정산: 받을 금액 계산', () => {
      const result = calculator.calculateSellExecution({
        fillPrice: new Decimal('160'),
        fillQty: new Decimal('100'),
      });

      expect(result.proceeds.toString()).toBe('16000');
    });
  });
});
