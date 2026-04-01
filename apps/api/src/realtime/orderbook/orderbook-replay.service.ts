import { Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { MarketOrderbook } from '@chart/shared-types';
import { MessageEvent } from '@nestjs/common';

export type ReplayEvent = { t: number; data: MarketOrderbook };

@Injectable()
export class OrderbookReplayService {
  private readonly sessions = new Map<string, ReplayEvent[]>();

  store(events: ReplayEvent[]): string {
    const id = crypto.randomUUID();
    this.sessions.set(id, events);

    // 1시간 후 자동 정리
    setTimeout(() => this.sessions.delete(id), 60 * 60 * 1000);

    return id;
  }

  replay$(id: string): Observable<MessageEvent> | null {
    const events = this.sessions.get(id);
    if (!events || events.length === 0) return null;

    return new Observable<MessageEvent>((subscriber) => {
      const timers: ReturnType<typeof setTimeout>[] = events.map((event, i) =>
        setTimeout(() => {
          if (subscriber.closed) return;
          subscriber.next({ type: 'realtime', data: event.data });
          if (i === events.length - 1) subscriber.complete();
        }, event.t),
      );

      return () => timers.forEach((t) => clearTimeout(t));
    });
  }
}
