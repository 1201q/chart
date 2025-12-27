import { Column, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { DecimalStringTransformer } from './decimal-string.transformer';

@Entity({ name: 'TRADING_POSITION' })
@Index('UK_TRADING_POSITION_USER_MARKET', ['userId', 'market'], { unique: true })
@Index('IX_TRADING_POSITION_USER', ['userId'])
@Index('IX_TRADING_POSITION_MARKET', ['market'])
export class TradingPosition {
  @PrimaryGeneratedColumn('uuid', { name: 'ID' })
  id: string;

  @Column({ type: 'varchar2', length: 36, name: 'USER_ID' })
  userId: string;

  @Column({ type: 'varchar2', length: 20, name: 'MARKET' })
  market: string;

  @Column({ type: 'varchar2', length: 20, name: 'ASSET_SYMBOL' })
  assetSymbol: string;

  @Column({
    type: 'number',
    precision: 38,
    scale: 18,
    name: 'QTY',
    default: 0,
    transformer: DecimalStringTransformer,
  })
  qty: string;

  @Column({
    type: 'number',
    precision: 38,
    scale: 18,
    name: 'AVG_PRICE',
    default: 0,
    transformer: DecimalStringTransformer,
  })
  avgPrice: string;

  @Column({
    type: 'number',
    precision: 38,
    scale: 18,
    name: 'COST',
    default: 0,
    transformer: DecimalStringTransformer,
  })
  cost: string;

  @Column({
    type: 'number',
    precision: 38,
    scale: 18,
    name: 'REALIZED_PNL',
    default: 0,
    transformer: DecimalStringTransformer,
  })
  realizedPnl: string;

  @UpdateDateColumn({
    type: 'timestamp',
    name: 'UPDATED_AT',
    default: () => 'SYSTIMESTAMP',
  })
  updatedAt: Date;
}
