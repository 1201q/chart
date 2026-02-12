import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { TradingBalance } from './trading-balance.entity';
import { TradingOrder } from './trading-order.entity';
import { TradingFill } from './trading-fill.entity';
import { TradingPosition } from './trading-position.entity';

export type UserRole = 'ADMIN' | 'USER';
export type AuthProvider = 'GOOGLE' | 'NAVER';

@Entity({ name: 'TRADING_USER' })
@Index('UK_TRADING_USER_EMAIL', ['email'], { unique: true })
@Index('UK_TRADING_USER_PROVIDER', ['provider', 'providerId'], { unique: true })
export class TradingUser {
  @PrimaryGeneratedColumn('uuid', { name: 'ID' })
  id: string;

  @Column({ type: 'varchar2', length: 255, name: 'EMAIL' })
  email!: string;

  @Column({ type: 'varchar2', length: 50, name: 'NICKNAME', nullable: true })
  nickname: string | null;

  @Column({ type: 'varchar2', length: 500, name: 'PROFILE_IMAGE_URL', nullable: true })
  profileImageUrl: string | null;

  @Column({ type: 'varchar2', length: 10, name: 'ROLE', default: 'USER' })
  role!: UserRole;

  @Column({ type: 'varchar2', length: 10, name: 'PROVIDER' })
  provider!: AuthProvider;

  @Column({ type: 'varchar2', length: 255, name: 'PROVIDER_ID' })
  providerId!: string;

  @Column({ type: 'number', name: 'IS_ACTIVE', default: 1 })
  isActive!: number; // Oracle: 1 = true, 0 = false

  @Column({
    type: 'timestamp with local time zone',
    name: 'LAST_LOGIN_AT',
    nullable: true,
  })
  lastLoginAt: Date | null;

  @CreateDateColumn({
    type: 'timestamp with local time zone',
    name: 'CREATED_AT',
    default: () => 'SYSTIMESTAMP',
  })
  createdAt!: Date;

  @UpdateDateColumn({
    type: 'timestamp with local time zone',
    name: 'UPDATED_AT',
    default: () => 'SYSTIMESTAMP',
  })
  updatedAt!: Date;

  @OneToMany(() => TradingBalance, (b) => b.user) balances!: TradingBalance[];
  @OneToMany(() => TradingOrder, (o) => o.user) orders!: TradingOrder[];
  @OneToMany(() => TradingFill, (f) => f.user) fills!: TradingFill[];
  @OneToMany(() => TradingPosition, (p) => p.user) positions!: TradingPosition[];
}
