import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { UpbitMarket } from 'src/market/entities/upbit-market.entity';

@Entity('COIN_INFO')
@Index(['upbitMarketId'], { unique: true })
export class CoinInfo {
  @PrimaryGeneratedColumn({ name: 'ID', type: 'number' })
  id: number;

  // ====== 1:1 연결 (COIN_INFO.UPBIT_MARKET_ID -> UPBIT_MARKET.ID)
  @Column({ name: 'UPBIT_MARKET_ID', type: 'number' })
  upbitMarketId: number;

  @OneToOne(() => UpbitMarket, { eager: false })
  @JoinColumn({ name: 'UPBIT_MARKET_ID' })
  upbitMarket: UpbitMarket;

  // ====== CMC 고유 ID
  @Column({ name: 'CMC_ID', type: 'number' })
  cmcId: number;

  // 실제로 요청에 사용한 심볼(예: FCT2 / FCT)
  @Column({ name: 'REQUEST_SYMBOL', type: 'varchar2', length: 32, nullable: true })
  requestSymbol: string | null;

  @Column({ name: 'LOGO_URL', type: 'varchar2', length: 1024, nullable: true })
  logoUrl: string | null;

  // OCI 업로드 결과
  @Column({ name: 'ICON_OBJECT_KEY', type: 'varchar2', length: 512, nullable: true })
  iconObjectKey: string | null;

  @Column({ name: 'ICON_PUBLIC_URL', type: 'varchar2', length: 1024, nullable: true })
  iconPublicUrl: string | null;

  // 설명(EN/KO)
  @Column({ name: 'DESCRIPTION_EN', type: 'clob', nullable: true })
  descriptionEn: string | null;

  @Column({ name: 'DESCRIPTION_KO', type: 'clob', nullable: true })
  descriptionKo: string | null;

  @Column({ name: 'LAST_CMC_SYNCED_AT', type: 'timestamp', nullable: true })
  lastCmcSyncedAt: Date | null;

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
