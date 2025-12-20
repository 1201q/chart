export type OrderMode = 'buy' | 'sell';
export type OrderType = 'limit' | 'market';

export type OrderFormState = {
  mode: OrderMode;
  type: OrderType;

  price: number | null;
  qty: number | null;

  // 사용자가 input을 건드렸는지?
  priceTouched: boolean;
  qtyTouched: boolean;
};

type Listener = () => void;

export class OrderFormStore {
  private state: OrderFormState;
  private listeners = new Set<Listener>();

  constructor(initial?: Partial<OrderFormState>) {
    this.state = {
      mode: initial?.mode ?? 'buy',
      type: initial?.type ?? 'limit',
      price: initial?.price ?? null,
      qty: initial?.qty ?? null,
      qtyTouched: initial?.qtyTouched ?? false,
      priceTouched: initial?.priceTouched ?? false,
    };
  }

  subscribe = (listener: Listener) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = () => this.state;

  private setState(patch: Partial<OrderFormState>) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((listener) => listener());
  }

  setMode(mode: OrderMode) {
    this.setState({ mode });
  }

  setType(type: OrderType) {
    this.setState({ type });
  }

  // 오더북 클릭 -> 가격 세팅
  setPrice(price: number | null, touched = true) {
    this.setState({ price, priceTouched: touched ? true : this.state.priceTouched });
  }

  setQty(qty: number | null, touched = true) {
    this.setState({ qty, qtyTouched: touched ? true : this.state.qtyTouched });
  }

  // 렌더 시점, 가격을 한번만 설정함.
  initPriceOnce(price: number) {
    if (this.state.priceTouched) return;
    if (this.state.price !== null) return;
    this.setState({ price });

    console.log('OrderFormStore: initPriceOnce', price);
  }

  reset() {
    this.setState({
      type: 'limit',
      price: null,
      qty: null,
      priceTouched: false,
      qtyTouched: false,
    });
  }
}
