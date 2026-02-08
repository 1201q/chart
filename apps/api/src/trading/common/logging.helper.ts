import { Logger } from '@nestjs/common';
import type Decimal from 'decimal.js-light';

/**
 * Trading 전용 로거
 */
export class TradingLogger {
  private readonly logger: Logger;

  constructor(context: string) {
    this.logger = new Logger(context);
  }

  // ============================================
  // 체결 로그
  // ============================================
  logMatchStart(market: string, buyOrders: number, sellOrders: number) {
    this.logger.log(`🔄 Matching ${market} | Buy: ${buyOrders}, Sell: ${sellOrders}`);
  }

  logMatchComplete(
    market: string,
    matchedOrders: number,
    fills: number,
    durationMs: number,
  ) {
    this.logger.log(
      `✅ ${market} | Matched: ${matchedOrders} orders, ${fills} fills | ${durationMs}ms`,
    );
  }

  logMatchSkipped(market: string, reason: string) {
    this.logger.debug(`⏭️ Skipped ${market}: ${reason}`);
  }

  logMatchError(market: string, error: Error) {
    this.logger.error(`❌ Match failed: ${market}`, error.stack);
  }

  // ============================================
  // 주문 로그
  // ============================================

  logOrderCreated(
    orderId: string,
    market: string,
    side: string,
    type: string,
    price: string,
    qty: string,
  ) {
    this.logger.log(
      `📝 Order created: ${orderId} | ${market} ${side} ${type} | ${qty}@${price}`,
    );
  }

  logOrderFilled(
    orderId: string,
    filledQty: string,
    remainingQty: string,
    status: string,
  ) {
    this.logger.log(
      `✅ Order filled: ${orderId} | Filled: ${filledQty}, Remaining: ${remainingQty} | ${status}`,
    );
  }

  logOrderCanceled(orderId: string, market: string) {
    this.logger.log(`❌ Order canceled: ${orderId} | ${market}`);
  }

  // ============================================
  // 체결 내역 로그
  // ============================================

  logFillCreated(
    orderId: string,
    side: string,
    price: string | Decimal,
    qty: string | Decimal,
  ) {
    this.logger.debug(`💰 Fill: ${orderId} | ${side} | ${qty}@${price}`);
  }

  // ============================================
  // 잔고 로그
  // ============================================

  logBalanceReserved(
    currency: string,
    amount: string | Decimal,
    available: string,
    locked: string,
  ) {
    this.logger.debug(
      `🔒 Balance reserved: ${currency} | Amount: ${amount} | Available: ${available}, Locked: ${locked}`,
    );
  }

  logBalanceReleased(
    currency: string,
    amount: string | Decimal,
    refund: string | Decimal,
  ) {
    this.logger.debug(
      `🔓 Balance released: ${currency} | Amount: ${amount}, Refund: ${refund}`,
    );
  }

  logBalanceRestored(currency: string, amount: string | Decimal) {
    this.logger.debug(`↩️ Balance restored: ${currency} | Amount: ${amount}`);
  }

  // ============================================
  // 포지션 로그
  // ============================================

  logPositionUpdated(
    market: string,
    side: string,
    qty: string,
    avgPrice: string,
    cost: string,
  ) {
    this.logger.debug(
      `📊 Position updated: ${market} | ${side} | Qty: ${qty}, AvgPrice: ${avgPrice}, Cost: ${cost}`,
    );
  }

  logPositionClosed(market: string, realizedPnl: string) {
    this.logger.log(`🎯 Position closed: ${market} | Realized P&L: ${realizedPnl}`);
  }

  // ============================================
  // 성능 로그
  // ============================================

  logPerformance(operation: string, durationMs: number) {
    if (durationMs > 100) {
      this.logger.warn(`⏱️ SLOW: ${operation} took ${durationMs}ms`);
    } else {
      this.logger.debug(`⏱️ ${operation}: ${durationMs}ms`);
    }
  }

  // ============================================
  // 에러 로그
  // ============================================

  logError(operation: string, error: Error, context?: any) {
    this.logger.error(
      `❌ ${operation} failed${context ? `: ${JSON.stringify(context)}` : ''}`,
      error.stack,
    );
  }

  // ============================================
  // 일반 로그
  // ============================================

  log(message: string) {
    this.logger.log(message);
  }

  debug(message: string) {
    this.logger.debug(message);
  }

  warn(message: string) {
    this.logger.warn(message);
  }

  error(message: string, trace?: string) {
    this.logger.error(message, trace);
  }
}
