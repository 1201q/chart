export type Listener = () => void;

export class ExternalStoreBase {
  private listeners = new Set<Listener>();
  private scheduled = false;

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  protected notify() {
    if (this.scheduled) return;
    this.scheduled = true;

    // ssr 방지
    if (typeof window === 'undefined') {
      this.scheduled = false;
      this.listeners.forEach((l) => l());
      return;
    }

    requestAnimationFrame(() => {
      this.scheduled = false;
      this.listeners.forEach((listener) => listener());
    });
  }
}
