import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { DecimalStringTransformer } from './decimal-string.transformer';
import { TradingUser } from './trading-user.entity';
import { TradingFill } from './trading-fill.entity';

export type OrderSide = 'BUY' | 'SELL';
export type OrderType = 'LIMIT';
export type OrderStatus = 'OPEN' | 'FILLED' | 'CANCELED';

@Entity({ name: 'TRADING_ORDER' })
@Index('IX_TRADING_ORDER_USER_CREATED', ['userId', 'createdAt'])
@Index('IX_TRADING_ORDER_USER_STATUS_CREATED', ['userId', 'status', 'createdAt'])
@Index('IX_TRADING_ORDER_MARKET_STATUS_CREATED', ['market', 'status', 'createdAt'])
export class TradingOrder {
  @PrimaryGeneratedColumn('uuid', { name: 'ID' })
  id: string;

  @Column({ type: 'varchar2', length: 36, name: 'USER_ID' })
  userId!: string;

  @ManyToOne(() => TradingUser, (u) => u.orders, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'USER_ID' })
  user!: TradingUser;

  @Column({ type: 'varchar2', length: 30, name: 'MARKET' })
  market!: string;

  @Column({ type: 'varchar2', length: 4, name: 'SIDE' })
  side!: OrderSide;

  @Column({ type: 'varchar2', length: 10, name: 'TYPE' })
  type!: OrderType;

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
    name: 'FILLED_QTY',
    default: 0,
    transformer: DecimalStringTransformer,
  })
  filledQty!: string;

  @Column({
    type: 'number',
    precision: 38,
    scale: 18,
    name: 'REMAINING_QTY',
    transformer: DecimalStringTransformer,
  })
  remainingQty!: string;

  @Column({ type: 'varchar2', length: 10, name: 'STATUS' })
  status!: OrderStatus;

  @Column({
    type: 'number',
    precision: 38,
    scale: 18,
    name: 'RESERVED_AMOUNT',
    nullable: true,
    transformer: DecimalStringTransformer,
  })
  reservedAmount!: string | null;

  @CreateDateColumn({
    type: 'timestamp',
    name: 'CREATED_AT',
    default: () => 'SYSTIMESTAMP',
  })
  createdAt!: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    name: 'UPDATED_AT',
    default: () => 'SYSTIMESTAMP',
  })
  updatedAt!: Date;

  @Column({ type: 'timestamp', name: 'CANCELED_AT', nullable: true })
  canceledAt!: Date | null;

  @Column({ type: 'timestamp', name: 'FILLED_AT', nullable: true })
  filledAt!: Date | null;

  @OneToMany(() => TradingFill, (f) => f.order) fills!: TradingFill[];
}
