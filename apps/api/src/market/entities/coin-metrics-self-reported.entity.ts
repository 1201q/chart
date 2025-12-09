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

@Entity('COIN_METRICS_SELF_REPORTED')
@Index(['coinId'], { unique: true })
export class CoinMetricsSelfReported {
  @PrimaryGeneratedColumn({ name: 'ID', type: 'number' })
  id: number;

  @ManyToOne(() => CoinInfo, (coin) => coin.selfReportedMetrics, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'COIN_ID' })
  coin: CoinInfo;

  @Column({ name: 'COIN_ID', type: 'number' })
  coinId: number;

  @Column({
    name: 'CIRCULATING_SUPPLY',
    type: 'number',
    nullable: true,
  })
  circulatingSupply: number | null;

  @Column({
    name: 'MARKET_CAP',
    type: 'number',
    nullable: true,
  })
  marketCap: number | null;

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
