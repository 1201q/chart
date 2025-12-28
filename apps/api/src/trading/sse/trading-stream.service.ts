import { Injectable } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import { TradingSseEvent } from './trading-sse.types';

@Injectable()
export class TradingStreamService {
  private readonly userStreams = new Map<string, Subject<TradingSseEvent>>();

  private getOrCreate(userId: string) {
    let s = this.userStreams.get(userId);

    if (!s) {
      s = new Subject<TradingSseEvent>();
      this.userStreams.set(userId, s);
    }
    return s;
  }

  publishToUser(userId: string, event: TradingSseEvent) {
    const s = this.getOrCreate(userId);
    if (!s) return;
    s.next(event);
  }

  subscribe(userId: string): Observable<TradingSseEvent> {
    return this.getOrCreate(userId).asObservable();
  }
}
