import { Injectable, Logger } from '@nestjs/common';

/**
 * OPEN 주문이 있는 마켓을 메모리에서 추적
 */
@Injectable()
export class ActiveMarketService {
  private readonly logger = new Logger(ActiveMarketService.name);
  private readonly activeSet = new Set<string>();

  // 주문 생성시
  add(market: string): void {
    const normalized = market.toUpperCase();
    if (!this.activeSet.has(normalized)) {
      this.activeSet.add(normalized);
      this.logger.debug(`➕ Active market added: ${normalized}`);
    }
  }

  // 체결 완료시(open 주문 없음)시 remove
  remove(market: string): void {
    const normalized = market.toUpperCase();
    if (this.activeSet.delete(normalized)) {
      this.logger.debug(`➖ Active market removed: ${normalized}`);
    }
  }

  has(market: string): boolean {
    return this.activeSet.has(market.toUpperCase());
  }

  // Processor에서 getActiveMarkets()로 조회
  getActiveMarkets(): string[] {
    return Array.from(this.activeSet);
  }

  getCount(): number {
    return this.activeSet.size;
  }

  clear(): void {
    this.activeSet.clear();
    this.logger.debug('🗑️ All active markets cleared');
  }
}
