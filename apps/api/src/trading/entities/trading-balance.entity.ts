import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DecimalStringTransformer } from './decimal-string.transformer';
import { TradingUser } from './trading-user.entity';

@Entity({ name: 'TRADING_BALANCE' })
@Index('IX_TRADING_BALANCE_USER', ['userId'])
export class TradingBalance {
  @PrimaryColumn({ type: 'varchar2', length: 36, name: 'USER_ID' })
  userId!: string;

  @PrimaryColumn({ type: 'varchar2', length: 20, name: 'CURRENCY' })
  currency!: string;

  @ManyToOne(() => TradingUser, (u) => u.balances, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'USER_ID' })
  user!: TradingUser;

  @Column({
    type: 'number',
    precision: 38,
    scale: 18,
    name: 'AVAILABLE',
    default: 0,
    transformer: DecimalStringTransformer,
  })
  available!: string;

  @Column({
    type: 'number',
    precision: 38,
    scale: 18,
    name: 'LOCKED',
    default: 0,
    transformer: DecimalStringTransformer,
  })
  locked!: string;

  @UpdateDateColumn({
    type: 'timestamp',
    name: 'UPDATED_AT',
    default: () => 'SYSTIMESTAMP',
  })
  updatedAt!: Date;
}
