import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import dayjs from 'dayjs';

import { TradingDeposit } from '../entities/trading-deposit.entity';
import { TradingBalance } from '../entities/trading-balance.entity';
import { TradingUser } from '../entities/trading-user.entity';
import { TradingStreamService } from '../sse/trading-stream.service';
import { mapBalance } from '../sse/trading-sse.mappers';
import { DepositBodyDto, InitializeBalanceBodyDto } from './deposit.dto';
import { DEPOSIT_LIMIT_PER_MONTH } from './deposit.constants';
import { D, formatKRW } from 'src/common/helpers/decimal';

@Injectable()
export class DepositService {
  private readonly logger = new Logger(DepositService.name);

  constructor(
    private readonly ds: DataSource,
    private readonly stream: TradingStreamService,

    @InjectRepository(TradingDeposit)
    private readonly depositRepo: Repository<TradingDeposit>,

    @InjectRepository(TradingBalance)
    private readonly balanceRepo: Repository<TradingBalance>,

    @InjectRepository(TradingUser)
    private readonly userRepo: Repository<TradingUser>,
  ) {}

  // ─────────────────────────────────────────────
  // 초기 원화 설정 (1회성, 월 한도 미포함)
  // ─────────────────────────────────────────────
  async initialize(userId: string, dto: InitializeBalanceBodyDto) {
    const user = await this.userRepo.findOne({ where: { id: userId } });

    if (user.isInitialized === 1) {
      throw new ConflictException('이미 초기 원화 설정이 완료된 계정입니다.');
    }

    await this.ds.transaction(async (manager) => {
      const balanceRepo = manager.getRepository(TradingBalance);
      const userRepo = manager.getRepository(TradingUser);

      // KRW 잔고 생성 또는 업데이트
      let balance = await balanceRepo.findOne({
        where: { userId, currency: 'KRW' },
        lock: { mode: 'pessimistic_write' },
      });

      if (balance) {
        balance.available = dto.amount.toString();
      } else {
        balance = balanceRepo.create({
          userId,
          currency: 'KRW',
          available: dto.amount.toString(),
          locked: '0',
        });
      }

      await balanceRepo.save(balance);

      // isInitialized 플래그 설정
      user.isInitialized = 1;
      await userRepo.save(user);

      this.logger.log(`✅ User initialized: ${userId}, amount: ${dto.amount}`);

      // SSE 잔고 변경 push
      this.stream.publishToUser(userId, {
        type: 'balance',
        data: [mapBalance(balance)],
      });
    });

    return { ok: true, amount: dto.amount };
  }

  // ─────────────────────────────────────────────
  // 원화 입금 (월 3회 제한)
  // ─────────────────────────────────────────────
  async deposit(userId: string, dto: DepositBodyDto) {
    const depositMonth = dayjs().format('YYYY-MM');

    // 이번달 입금 횟수 체크
    const usedCount = await this.depositRepo.count({
      where: { userId, depositMonth },
    });

    if (usedCount >= DEPOSIT_LIMIT_PER_MONTH) {
      throw new BadRequestException(
        `이번 달 입금 한도(${DEPOSIT_LIMIT_PER_MONTH}회)를 초과했습니다.`,
      );
    }

    await this.ds.transaction(async (manager) => {
      const balanceRepo = manager.getRepository(TradingBalance);
      const depositRepo = manager.getRepository(TradingDeposit);

      // KRW 잔고 증가
      const balance = await balanceRepo.findOne({
        where: { userId, currency: 'KRW' },
        lock: { mode: 'pessimistic_write' },
      });

      if (!balance) {
        throw new BadRequestException('초기 원화 설정이 필요합니다.');
      }

      balance.available = formatKRW(D(balance.available).plus(dto.amount));

      await balanceRepo.save(balance);

      // 입금 이력 저장
      await depositRepo.save(
        depositRepo.create({
          userId,
          amount: dto.amount,
          depositMonth,
        }),
      );

      this.logger.log(
        `💰 Deposit: userId=${userId}, amount=${dto.amount}, month=${depositMonth} (${usedCount + 1}/${DEPOSIT_LIMIT_PER_MONTH})`,
      );

      // SSE 잔고 변경 push
      this.stream.publishToUser(userId, {
        type: 'balance',
        data: [mapBalance(balance)],
      });
    });

    return {
      ok: true,
      amount: dto.amount,
      depositMonth,
      remaining: DEPOSIT_LIMIT_PER_MONTH - (usedCount + 1),
    };
  }

  // ─────────────────────────────────────────────
  // 이번달 입금 현황
  // ─────────────────────────────────────────────
  async getStatus(userId: string) {
    const depositMonth = dayjs().format('YYYY-MM');

    const used = await this.depositRepo.count({
      where: { userId, depositMonth },
    });

    return {
      depositMonth,
      used,
      remaining: DEPOSIT_LIMIT_PER_MONTH - used,
      limit: DEPOSIT_LIMIT_PER_MONTH,
    };
  }

  // ─────────────────────────────────────────────
  // 전체 입금 이력
  // ─────────────────────────────────────────────
  async getHistory(userId: string) {
    const rows = await this.depositRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    return {
      ok: true,
      history: rows.map((r) => ({
        id: r.id,
        amount: r.amount,
        depositMonth: r.depositMonth,
        createdAt: r.createdAt,
      })),
    };
  }
}
