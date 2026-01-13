export type Listener = () => void;

export class KeyedExternalStoreBase<K> {
  private listenersByKey = new Map<K, Set<Listener>>();

  private scheduledKeys = new Set<K>();
  private scheduled = false;

  subscribeKey(key: K, listener: Listener) {
    let set = this.listenersByKey.get(key);

    if (!set) {
      set = new Set();
      this.listenersByKey.set(key, set);
    }

    set.add(listener);

    return () => {
      set!.delete(listener);
      if (set!.size === 0) {
        this.listenersByKey.delete(key);
      }
    };
  }

  protected getSubscribedKeys(): K[] {
    return Array.from(this.listenersByKey.keys());
  }

  protected notifyKey(key: K) {
    this.scheduledKeys.add(key);
    this.scheduleFlush();
  }

  // key 없어도 flush 동작하도록, (all)
  protected scheduleFlush() {
    if (this.scheduled) return;
    this.scheduled = true;

    // ssr 방지
    if (typeof window === 'undefined') {
      this.flushNow();
      return;
    }

    requestAnimationFrame(() => this.flushNow());
  }

  private flushNow() {
    this.scheduled = false;

    const keys = Array.from(this.scheduledKeys);
    this.scheduledKeys.clear();

    for (const key of keys) {
      const listeners = this.listenersByKey.get(key);
      if (!listeners) continue;
      listeners.forEach((l) => l());
    }

    this.afterFlush();
  }

  // 받는 클래스가 flush끝에 추가 동작필요할 경우 사용함
  protected afterFlush() {}
}
