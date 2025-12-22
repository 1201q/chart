import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { TradingBalance } from './trading-balance.entity';
import { TradingOrder } from './trading-order.entity';
import { TradingFill } from './trading-fill.entity';

@Entity({ name: 'TRADING_USER' })
@Index('UK_TRADING_USER_USERNAME', ['username'], { unique: true })
export class TradingUser {
  @PrimaryGeneratedColumn('uuid', { name: 'ID' })
  id: string;

  @Column({ type: 'varchar2', length: 50, name: 'USERNAME' })
  username!: string;

  @CreateDateColumn({
    type: 'timestamp',
    name: 'CREATED_AT',
    default: () => 'SYSTIMESTAMP',
  })
  createdAt!: Date;

  @OneToMany(() => TradingBalance, (b) => b.user) balances!: TradingBalance[];
  @OneToMany(() => TradingOrder, (o) => o.user) orders!: TradingOrder[];
  @OneToMany(() => TradingFill, (f) => f.user) fills!: TradingFill[];
}
