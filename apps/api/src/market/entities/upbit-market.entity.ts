import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  BeforeInsert,
  BeforeUpdate,
  OneToOne,
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

  @Column({ name: 'SUB_QUOTE_CURRENCY', type: 'varchar2', length: 32, nullable: true })
  subQuoteCurrency: string; // 만약,숫자로 끝날경우 숫자를 제거한 코드

  @Column({ name: 'KOREAN_NAME', type: 'varchar2', length: 128 })
  koreanName: string;

  @Column({ name: 'ENGLISH_NAME', type: 'varchar2', length: 128 })
  englishName: string;

  @Column({ name: 'IS_ACTIVE', type: 'number', default: 1 })
  isActive: number; // 1: active, 0: inactive

  @OneToOne(() => CoinInfo, (ci) => ci.upbitMarket, { eager: false })
  coinInfo: CoinInfo;

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

  // 숫자로 끝날경우, 숫자만 제거함
  private static normalizeQuoteCurrent(quote: string | null): string | null {
    if (!quote) return null;

    return quote.replace(/\d+$/, '');
  }

  @BeforeInsert()
  @BeforeUpdate()
  setSubQuoteCurrency() {
    this.subQuoteCurrency = UpbitMarket.normalizeQuoteCurrent(this.quoteCurrency);
  }
}
