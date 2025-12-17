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

  @Column({ name: 'MARKET_CURRENCY', type: 'varchar2', length: 16 })
  marketCurrency: string; // KRW

  @Column({ name: 'ASSET_SYMBOL', type: 'varchar2', length: 32 })
  assetSymbol: string; // SXP

  @Column({ name: 'ASSET_SYMBOL_NORM', type: 'varchar2', length: 32, nullable: true })
  assetSymbolNormalized: string; // 만약,숫자로 끝날경우 숫자를 제거한 코드

  @Column({ name: 'KOREAN_NAME', type: 'varchar2', length: 128 })
  koreanName: string;

  @Column({ name: 'ENGLISH_NAME', type: 'varchar2', length: 128 })
  englishName: string;

  @Column({ name: 'IS_ACTIVE', type: 'number', default: 1 })
  isActive: number; // 1: active, 0: inactive

  @OneToOne(() => CoinInfo, (ci) => ci.upbitMarket, { eager: false })
  coinInfo?: CoinInfo;

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
  private static normalizeAssetSymbol(symbol: string | null): string | null {
    if (!symbol) return null;

    return symbol.replace(/\d+$/, '');
  }

  @BeforeInsert()
  @BeforeUpdate()
  setAssetSymbolNormalized() {
    this.assetSymbolNormalized = UpbitMarket.normalizeAssetSymbol(this.assetSymbol);
  }
}
