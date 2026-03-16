import { currentRoute, emitPerfEvent, nowMs } from './log';

interface TrackedEventSourceOptions {
  key: string;
  url: string;
  withCredentials?: boolean;
  firstEventTypes?: string[];
}

export function createTrackedEventSource({
  key,
  url,
  withCredentials = false,
  firstEventTypes = ['message'],
}: TrackedEventSourceOptions) {
  const startedAt = nowMs();
  const es = new EventSource(url, { withCredentials });

  let openCount = 0;
  let firstMessageCaptured = false;

  const captureFirstMessage = (eventType: string) => {
    if (firstMessageCaptured) return;
    firstMessageCaptured = true;

    emitPerfEvent({
      type: 'sse',
      name: 'sse-first-message',
      ts: Date.now(),
      route: currentRoute(),
      url,
      duration: nowMs() - startedAt,
      detail: {
        key,
        eventType,
      },
    });
  };

  es.addEventListener('open', () => {
    openCount += 1;

    emitPerfEvent({
      type: 'sse',
      name: openCount === 1 ? 'sse-open' : 'sse-reopen',
      ts: Date.now(),
      route: currentRoute(),
      url,
      duration: nowMs() - startedAt,
      detail: {
        key,
        openCount,
      },
    });
  });

  for (const eventType of firstEventTypes) {
    es.addEventListener(eventType, () => captureFirstMessage(eventType));
  }

  es.addEventListener('error', () => {
    emitPerfEvent({
      type: 'sse',
      name: 'sse-error',
      ts: Date.now(),
      route: currentRoute(),
      url,
      detail: {
        key,
        openCount,
      },
    });
  });

  return es;
}
