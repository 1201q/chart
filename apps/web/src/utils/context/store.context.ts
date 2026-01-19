import { createContext } from 'react';
import { MarketTradingStore } from '../stores/new/MarketTradingStore';
import { OrderbookRowStore } from '../stores/new/OrderbookRowStore';
import { TickerStore } from '../stores/new/TickerStore';
import { TradeStore } from '../stores/new/TradeStore';
import { OrderFormStore } from '../stores/orderform.store';

export const MarketTradingStoreContext = createContext<MarketTradingStore | null>(null);
export const OrderbookStoreContext = createContext<OrderbookRowStore | null>(null);
export const TickerStoreContext = createContext<TickerStore | null>(null);
export const TradeStoreContext = createContext<TradeStore | null>(null);
export const OrderFormStoreContext = createContext<OrderFormStore | null>(null);
