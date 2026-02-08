import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm';

@Entity('CANDLE_240M_FINALIZED')
@Index(['market', 'candleTime'], { unique: true })
@Index(['market', 'finalizedAt'])
export class Candle240mFinalized {
  @PrimaryGeneratedColumn({ name: 'ID', type: 'number' })
  id: number;

  @Column({ name: 'MARKET', type: 'varchar2', length: 20 })
  market: string;

  @Column({ name: 'CANDLE_TIME', type: 'timestamp' })
  candleTime: Date;

  @Column({ name: 'ACC_VOLUME', type: 'number', precision: 38, scale: 18 })
  accVolume: string;

  @Column({ name: 'ACC_PRICE', type: 'number', precision: 38, scale: 12 })
  accPrice: string;

  @Column({
    name: 'FINALIZED_AT',
    type: 'timestamp',
    default: () => 'SYSTIMESTAMP',
  })
  finalizedAt: Date;

  @Column({
    name: 'CREATED_AT',
    type: 'timestamp',
    default: () => 'SYSTIMESTAMP',
  })
  createdAt: Date;
}
