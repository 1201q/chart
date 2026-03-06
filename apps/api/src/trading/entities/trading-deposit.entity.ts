import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { TradingUser } from './trading-user.entity';

@Entity({ name: 'TRADING_DEPOSIT' })
@Index('IX_TRADING_DEPOSIT_USER_MONTH', ['userId', 'depositMonth'])
export class TradingDeposit {
  @PrimaryGeneratedColumn('uuid', { name: 'ID' })
  id: string;

  @Column({ type: 'varchar2', length: 36, name: 'USER_ID' })
  userId!: string;

  @ManyToOne(() => TradingUser, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'USER_ID' })
  user!: Relation<TradingUser>;

  @Column({ type: 'number', name: 'AMOUNT' })
  amount!: number;

  @Column({ type: 'varchar2', length: 7, name: 'DEPOSIT_MONTH' })
  depositMonth!: string; // 'YYYY-MM'

  @CreateDateColumn({
    type: 'timestamp with local time zone',
    name: 'CREATED_AT',
    default: () => 'SYSTIMESTAMP',
  })
  createdAt!: Date;
}
