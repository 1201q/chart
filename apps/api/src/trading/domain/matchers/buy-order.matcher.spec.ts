import { BuyOrderMatcher } from './buy-order.matcher';
import Decimal from 'decimal.js-light';

describe('BuyOrderMatcher', () => {
  let matcher: BuyOrderMatcher;

  beforeEach(() => {
    matcher = new BuyOrderMatcher();
  });

  it('지정가 매수: 호가보다 높은 가격 → 체결', () => {
    const result = matcher.match(
      {
        type: 'LIMIT',
        price: new Decimal('500'),
        remainingQty: new Decimal('100'),
      },
      [
        { price: new Decimal('160'), size: new Decimal('50') },
        { price: new Decimal('161'), size: new Decimal('60') },
      ],
    );

    expect(result.fills).toHaveLength(2);
    expect(result.fills[0].price.toString()).toBe('160');
    expect(result.fills[0].qty.toString()).toBe('50');
    expect(result.fills[1].price.toString()).toBe('161');
    expect(result.fills[1].qty.toString()).toBe('50');
    expect(result.remainingQty.toString()).toBe('0');
    expect(result.totalFilled.toString()).toBe('100');
  });

  it('지정가 매수: 호가보다 낮은 가격 → 체결 안됨', () => {
    const result = matcher.match(
      {
        type: 'LIMIT',
        price: new Decimal('150'),
        remainingQty: new Decimal('100'),
      },
      [
        { price: new Decimal('160'), size: new Decimal('50') },
        { price: new Decimal('161'), size: new Decimal('60') },
      ],
    );

    expect(result.fills).toHaveLength(0);
    expect(result.remainingQty.toString()).toBe('100');
    expect(result.totalFilled.toString()).toBe('0');
  });

  it('시장가 매수: 모든 호가에 체결', () => {
    const result = matcher.match(
      {
        type: 'MARKET',
        price: new Decimal('0'), // 무시됨
        remainingQty: new Decimal('100'),
      },
      [
        { price: new Decimal('160'), size: new Decimal('50') },
        { price: new Decimal('170'), size: new Decimal('60') },
      ],
    );

    expect(result.fills).toHaveLength(2);
    expect(result.totalFilled.toString()).toBe('100');
  });

  it('부분 체결: 호가 수량 부족', () => {
    const result = matcher.match(
      {
        type: 'LIMIT',
        price: new Decimal('200'),
        remainingQty: new Decimal('100'),
      },
      [
        { price: new Decimal('160'), size: new Decimal('30') },
        { price: new Decimal('161'), size: new Decimal('20') },
      ],
    );

    expect(result.totalFilled.toString()).toBe('50');
    expect(result.remainingQty.toString()).toBe('50');
  });
});
