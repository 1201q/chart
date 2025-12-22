import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { DecimalStringTransformer } from './decimal-string.transformer';
import { TradingOrder } from './trading-order.entity';
import { TradingUser } from './trading-user.entity';

@Entity({ name: 'TRADING_FILL' })
@Index('IX_TRADING_FILL_USER_CREATED', ['userId', 'createdAt'])
@Index('IX_TRADING_FILL_ORDER', ['orderId'])
@Index('IX_TRADING_FILL_MARKET_CREATED', ['market', 'createdAt'])
export class TradingFill {
  @PrimaryGeneratedColumn('uuid', { name: 'ID' })
  id: string;

  @Column({ type: 'varchar2', length: 36, name: 'ORDER_ID' })
  orderId!: string;

  @ManyToOne(() => TradingOrder, (o) => o.fills, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ORDER_ID' })
  order!: TradingOrder;

  @Column({ type: 'varchar2', length: 36, name: 'USER_ID' })
  userId!: string;

  @ManyToOne(() => TradingUser, (u) => u.fills, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'USER_ID' })
  user!: TradingUser;

  @Column({ type: 'varchar2', length: 30, name: 'MARKET' })
  market!: string;

  @Column({ type: 'varchar2', length: 4, name: 'SIDE' })
  side!: 'BUY' | 'SELL';

  @Column({
    type: 'number',
    precision: 38,
    scale: 18,
    name: 'PRICE',
    transformer: DecimalStringTransformer,
  })
  price!: string;

  @Column({
    type: 'number',
    precision: 38,
    scale: 18,
    name: 'QTY',
    transformer: DecimalStringTransformer,
  })
  qty!: string;

  @Column({
    type: 'number',
    precision: 38,
    scale: 18,
    name: 'FEE',
    default: 0,
    transformer: DecimalStringTransformer,
  })
  fee!: string;

  @CreateDateColumn({
    type: 'timestamp',
    name: 'CREATED_AT',
    default: () => 'SYSTIMESTAMP',
  })
  createdAt!: Date;
}
