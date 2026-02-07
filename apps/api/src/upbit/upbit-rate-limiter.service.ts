import { Injectable, Logger } from '@nestjs/common';

interface QueuedTask<T> {
  fn: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: any) => void;
}

@Injectable()
export class UpbitRateLimiter {
  private readonly logger = new Logger(UpbitRateLimiter.name);

  private queue: QueuedTask<any>[] = [];
  private processing = false;
  private callTimestamps: number[] = [];

  private readonly MAX_CALLS_PER_SECOND = 10;
  private readonly WINDOW_MS = 1050; // 1.05초에 10번 // 업비트 1초 10번 제한

  /**
   * Rate limit이 적용된 함수 실행
   * - 1.05초에 최대 10번 호출 보장
   * - 대기 중인 요청은 큐에서 순차 처리
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({ fn, resolve, reject });
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      // 1.05초 이내 호출 기록 정리
      const now = Date.now();
      this.callTimestamps = this.callTimestamps.filter((t) => now - t < this.WINDOW_MS);

      // Rate limit 체크
      if (this.callTimestamps.length >= this.MAX_CALLS_PER_SECOND) {
        // 가장 오래된 호출로부터 1초 경과 대기
        const oldestCall = this.callTimestamps[0];
        const waitTime = this.WINDOW_MS - (now - oldestCall) + 10; // 10ms 버퍼!

        this.logger.verbose(
          `Rate limit reached. Waiting ${waitTime}ms (queue: ${this.queue.length})`,
        );

        await this.sleep(waitTime);
        continue;
      }

      // 큐에서 작업 꺼내기
      const task = this.queue.shift();
      this.callTimestamps.push(Date.now());

      // 작업 실행
      try {
        const result = await task.fn();
        task.resolve(result);
      } catch (error) {
        task.reject(error);
      }
    }

    this.processing = false;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 현재 큐 상태 조회
   */
  getStatus() {
    return {
      queueLength: this.queue.length,
      recentCalls: this.callTimestamps.length,
      processing: this.processing,
    };
  }
}
