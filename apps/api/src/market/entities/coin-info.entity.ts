import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { UpbitMarket } from './upbit-market.entity';
import { CoinMetricsSelfReported } from './coin-metrics-self-reported.entity';

@Entity('COIN_INFO')
@Index(['cmcId'], { unique: true })
@Index(['symbol'])
export class CoinInfo {
  @PrimaryGeneratedColumn({ name: 'ID', type: 'number' })
  id: number;

  @Column({ name: 'CMC_ID', type: 'number', nullable: true })
  cmcId: number | null;

  @Column({ name: 'SYMBOL', type: 'varchar2', length: 32 })
  symbol: string;

  @Column({ name: 'NAME', type: 'varchar2', length: 128 })
  name: string;

  @Column({ name: 'DESCRIPTION_EN', type: 'clob', nullable: true })
  descriptionEn: string | null;

  @Column({ name: 'DESCRIPTION_KO', type: 'clob', nullable: true })
  descriptionKo: string | null;

  @Column({ name: 'LOGO_URL_ORIGINAL', type: 'varchar2', length: 512, nullable: true })
  logoUrlOriginal: string | null;

  @Column({ name: 'ICON_PATH', type: 'varchar2', length: 512, nullable: true })
  iconPath: string | null;

  @Column({ name: 'DATE_ADDED', type: 'timestamp', nullable: true })
  dateAdded: Date | null;

  @Column({ name: 'DATE_LAUNCHED', type: 'timestamp', nullable: true })
  dateLaunched: Date | null;

  @Column({ name: 'WEBSITE_URL', type: 'varchar2', length: 512, nullable: true })
  websiteUrl: string | null;

  @Column({ name: 'TWITTER_URL', type: 'varchar2', length: 512, nullable: true })
  twitterUrl: string | null;

  @Column({ name: 'INFINITE_SUPPLY', type: 'number', default: 0 })
  infiniteSupply: number; // 0: finite, 1: infinite

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

  @OneToMany(() => UpbitMarket, (market) => market.coin)
  upbitMarkets: UpbitMarket[];

  @OneToMany(() => CoinMetricsSelfReported, (metrics) => metrics.coin)
  selfReportedMetrics: CoinMetricsSelfReported[];
}
