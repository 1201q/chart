import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { CoinInfo } from './coin-info.entity';

@Entity('UPBIT_MARKET')
@Index(['marketCode'], { unique: true })
export class UpbitMarket {
  @PrimaryGeneratedColumn({ name: 'ID', type: 'number' })
  id: number;

  @Column({ name: 'MARKET_CODE', type: 'varchar2', length: 32 })
  marketCode: string; // KRW-SXP

  @Column({ name: 'BASE_CURRENCY', type: 'varchar2', length: 16 })
  baseCurrency: string; // KRW

  @Column({ name: 'QUOTE_CURRENCY', type: 'varchar2', length: 32 })
  quoteCurrency: string; // SXP

  @Column({ name: 'KOREAN_NAME', type: 'varchar2', length: 128 })
  koreanName: string;

  @Column({ name: 'ENGLISH_NAME', type: 'varchar2', length: 128 })
  englishName: string;

  @Column({ name: 'IS_ACTIVE', type: 'number', default: 1 })
  isActive: number; // 1: active, 0: inactive

  @ManyToOne(() => CoinInfo, (coin) => coin.upbitMarkets, { nullable: true })
  @JoinColumn({ name: 'COIN_ID' })
  coin: CoinInfo | null;

  @Column({ name: 'COIN_ID', type: 'number', nullable: true })
  coinId: number | null;

  @CreateDateColumn({
    name: 'CREATED_AT',
    type: 'timestamp',
    default: () => 'SYSTIMESTAMP',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'UPDATED_AT',
    type: 'timestamp',
    default: () => 'SYSTIMESTAMP',
  })
  updatedAt: Date;
}
