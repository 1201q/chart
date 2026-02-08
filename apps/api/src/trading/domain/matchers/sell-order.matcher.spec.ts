import { SellOrderMatcher } from './sell-order.matcher';
import Decimal from 'decimal.js-light';

describe('SellOrderMatcher', () => {
  let matcher: SellOrderMatcher;

  beforeEach(() => {
    matcher = new SellOrderMatcher();
  });

  it('지정가 매도: 호가보다 낮은 가격 → 체결', () => {
    const result = matcher.match(
      {
        type: 'LIMIT',
        price: new Decimal('150'),
        remainingQty: new Decimal('100'),
      },
      [
        { price: new Decimal('160'), size: new Decimal('50') },
        { price: new Decimal('159'), size: new Decimal('60') },
      ],
    );

    expect(result.fills).toHaveLength(2);
    expect(result.fills[0].price.toString()).toBe('160');
    expect(result.fills[0].qty.toString()).toBe('50');
    expect(result.fills[1].price.toString()).toBe('159');
    expect(result.fills[1].qty.toString()).toBe('50');
    expect(result.remainingQty.toString()).toBe('0');
    expect(result.totalFilled.toString()).toBe('100');
  });

  it('지정가 매도: 호가보다 높은 가격 → 체결 안됨', () => {
    const result = matcher.match(
      {
        type: 'LIMIT',
        price: new Decimal('200'),
        remainingQty: new Decimal('100'),
      },
      [
        { price: new Decimal('160'), size: new Decimal('50') },
        { price: new Decimal('159'), size: new Decimal('60') },
      ],
    );

    expect(result.fills).toHaveLength(0);
    expect(result.remainingQty.toString()).toBe('100');
    expect(result.totalFilled.toString()).toBe('0');
  });

  it('시장가 매도: 모든 호가에 체결', () => {
    const result = matcher.match(
      {
        type: 'MARKET',
        price: new Decimal('0'),
        remainingQty: new Decimal('100'),
      },
      [
        { price: new Decimal('160'), size: new Decimal('50') },
        { price: new Decimal('159'), size: new Decimal('60') },
      ],
    );

    expect(result.fills).toHaveLength(2);
    expect(result.totalFilled.toString()).toBe('100');
  });
});
