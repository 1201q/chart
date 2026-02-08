import { Injectable, BadRequestException } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import Decimal from 'decimal.js-light';
import { TradingBalance } from '../../entities/trading-balance.entity';
import { TradingLogger } from 'src/trading/common/logging.helper';
import { formatDecimal } from '../../../common/helpers/decimal';

/**
 * 잔고 관리자
 * - DB CRUD + 락 관리
 * - 트랜잭션 내에서만 사용
 */
@Injectable()
export class BalanceManager {
  private readonly tradingLogger = new TradingLogger(BalanceManager.name);

  /**
   * 잔고 조회 (없다면 생성) + 비관적 락
   *
   * @example
   * const balance = await balanceManager.getOrCreateWithLock(
   *   manager,
   *   'user-1',
   *   'KRW'
   * );
   */
  async getOrCreateWithLock(
    manager: EntityManager,
    userId: string,
    currency: string,
  ): Promise<TradingBalance> {
    const balRepo = manager.getRepository(TradingBalance);

    // 1차 조회 (락)
    let balance = await balRepo.findOne({
      where: { userId, currency },
      lock: { mode: 'pessimistic_write' },
    });

    // 없으면 생성
    if (!balance) {
      balance = balRepo.create({
        userId,
        currency,
        available: '0',
        locked: '0',
      });
      await balRepo.save(balance);

      // 2차 조회 (락)
      balance = await balRepo.findOne({
        where: { userId, currency },
        lock: { mode: 'pessimistic_write' },
      });

      if (!balance) {
        throw new BadRequestException('Failed to create balance');
      }
    }

    return balance;
  }

  /**
   * 여러 잔고 한번에 조회 (정렬 보장)
   *
   * @example
   * const [krw, btc] = await balanceManager.getMultipleWithLock(
   *   manager,
   *   'user-1',
   *   ['KRW', 'BTC']
   * );
   */
  async getMultipleWithLock(
    manager: EntityManager,
    userId: string,
    currencies: string[],
  ): Promise<TradingBalance[]> {
    // 데드락 방지: 알파벳 순 정렬
    const sorted = [...currencies].sort();

    const balances: TradingBalance[] = [];
    for (const currency of sorted) {
      const balance = await this.getOrCreateWithLock(manager, userId, currency);
      balances.push(balance);
    }

    return balances;
  }

  /**
   * 잔고 예약 (available -> locked)
   *
   * @example
   * // 주문 생성 시
   * balanceManager.reserve(krwBalance, new Decimal('50000'));
   */
  reserve(balance: TradingBalance, amount: Decimal): void {
    const available = new Decimal(balance.available);
    const locked = new Decimal(balance.locked);

    if (available.lt(amount)) {
      throw new BadRequestException(
        `Insufficient balance: need ${formatDecimal(amount)}, have ${formatDecimal(available)}`,
      );
    }

    balance.available = formatDecimal(available.minus(amount));
    balance.locked = formatDecimal(locked.plus(amount));

    this.tradingLogger.logBalanceReserved(
      balance.currency,
      amount,
      balance.available,
      balance.locked,
    );
  }

  /**
   * 잔고 해제 + 환불 (locked -> available)
   *
   * @example
   * // 체결 시 (매수)
   * balanceManager.release(
   *   krwBalance,
   *   new Decimal('50000'),  // 잠금 해제
   *   new Decimal('34000')   // 환불
   * );
   */
  release(balance: TradingBalance, lockedAmount: Decimal, refund: Decimal): void {
    const locked = new Decimal(balance.locked);
    const available = new Decimal(balance.available);

    if (locked.lt(lockedAmount)) {
      throw new BadRequestException('Locked amount insufficient');
    }

    balance.locked = formatDecimal(locked.minus(lockedAmount));
    balance.available = formatDecimal(available.plus(refund));

    this.tradingLogger.logBalanceReleased(balance.currency, lockedAmount, refund);
  }

  /**
   * 잔고 증가 (체결로 자산 획득)
   *
   * @example
   * // 매수 체결 시 코인 획득
   * balanceManager.increase(btcBalance, new Decimal('1.5'));
   */
  increase(balance: TradingBalance, amount: Decimal): void {
    const available = new Decimal(balance.available);
    balance.available = formatDecimal(available.plus(amount));
  }

  /**
   * 잔고 감소 (locked에서 차감)
   *
   * @example
   * // 매도 체결 시 코인 소모
   * balanceManager.decreaseLocked(btcBalance, new Decimal('1.5'));
   */
  decreaseLocked(balance: TradingBalance, amount: Decimal): void {
    const locked = new Decimal(balance.locked);

    if (locked.lt(amount)) {
      throw new BadRequestException('Locked amount insufficient');
    }

    balance.locked = formatDecimal(locked.minus(amount));
  }

  /**
   * 주문 취소 시 잔고 복구 (locked -> available)
   *
   * @example
   * balanceManager.restoreFromCancel(
   *   krwBalance,
   *   new Decimal('50000')
   * );
   */
  restoreFromCancel(balance: TradingBalance, amount: Decimal): void {
    const locked = new Decimal(balance.locked);
    const available = new Decimal(balance.available);

    if (locked.lt(amount)) {
      throw new BadRequestException('Locked amount insufficient for cancel');
    }

    balance.locked = formatDecimal(locked.minus(amount));
    balance.available = formatDecimal(available.plus(amount));
  }
}
