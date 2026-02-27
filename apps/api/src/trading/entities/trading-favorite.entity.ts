import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TradingUser } from './trading-user.entity';

@Entity({ name: 'TRADING_FAVORITE' })
@Index('UK_FAV_USER_MARKET', ['userId', 'market'], { unique: true })
@Index('IX_FAV_USER', ['userId'])
export class TradingFavorite {
  @PrimaryGeneratedColumn('uuid', { name: 'ID' })
  id: string;

  @Column({ type: 'varchar2', length: 36, name: 'USER_ID' })
  userId!: string;

  @ManyToOne(() => TradingUser, (u) => u.favorites, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'USER_ID' })
  user!: TradingUser;

  @Column({ type: 'varchar2', length: 30, name: 'MARKET' })
  market!: string;

  @CreateDateColumn({
    type: 'timestamp with local time zone',
    name: 'CREATED_AT',
    default: () => 'SYSTIMESTAMP',
  })
  createdAt!: Date;
}
