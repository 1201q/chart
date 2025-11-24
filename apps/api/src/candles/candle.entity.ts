import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('UPBIT_CANDLE')
export class UpbitCandle {
  @PrimaryColumn({ name: 'MARKET', type: 'varchar2', length: 20 })
  market: string;

  @PrimaryColumn({ name: 'TIMEFRAME', type: 'varchar2', length: 4 })
  timeframe: string;

  @PrimaryColumn({ name: 'CANDLE_TIME', type: 'timestamp' })
  candleTime: Date;

  @Column({ name: 'OPEN_PRICE', type: 'number', precision: 30, scale: 12 })
  open: string;

  @Column({ name: 'HIGH_PRICE', type: 'number', precision: 30, scale: 12 })
  high: string;

  @Column({ name: 'LOW_PRICE', type: 'number', precision: 30, scale: 12 })
  low: string;

  @Column({ name: 'CLOSE_PRICE', type: 'number', precision: 30, scale: 12 })
  close: string;

  @Column({ name: 'ACC_VOLUME', type: 'number', precision: 38, scale: 18 })
  accVolume: string;

  @Column({ name: 'ACC_PRICE', type: 'number', precision: 38, scale: 12 })
  accPrice: string;

  @Column({
    name: 'CREATED_AT',
    type: 'timestamp',
    default: () => 'SYSTIMESTAMP',
  })
  createdAt: Date;
}
