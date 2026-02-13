import { Inject, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import Redis from 'ioredis';

import { TradingUser, AuthProvider } from 'src/trading/entities/trading-user.entity';
import { JwtPayload } from './types/jwt-payload.type';
import { now } from 'src/common/helpers/datetime';

export interface OAuthProfile {
  provider: AuthProvider;
  providerId: string;
  email: string;
  nickname: string;
  profileImageUrl?: string;
}

const RT_PREFIX = 'rt:';
const AT_EXPIRE_SEC = 60 * 15; // 15분
const RT_EXPIRE_SEC = 60 * 60 * 24 * 7; // 7일

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(TradingUser)
    private readonly userRepo: Repository<TradingUser>,

    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,

    @Inject('REDIS_CLIENT')
    private readonly redis: Redis,
  ) {}

  // ─────────────────────────────────────────────
  // OAuth 로그인 / 회원가입 처리
  // ─────────────────────────────────────────────
  async findOrCreateUser(profile: OAuthProfile): Promise<TradingUser> {
    const existing = await this.userRepo.findOne({
      where: { provider: profile.provider, providerId: profile.providerId },
    });

    if (existing) {
      // 마지막 로그인 시간 업데이트
      existing.lastLoginAt = now();
      return this.userRepo.save(existing);
    }

    // 신규 유저 생성
    const user = this.userRepo.create({
      email: profile.email,
      nickname: profile.nickname,
      profileImageUrl: profile.profileImageUrl ?? null,
      provider: profile.provider,
      providerId: profile.providerId,
      role: 'USER',
      isActive: 1,
      lastLoginAt: now(),
    });

    this.logger.log(`🎉 New user registered: ${profile.email} via ${profile.provider}`);
    return this.userRepo.save(user);
  }

  // ─────────────────────────────────────────────
  // 토큰 발급
  // ─────────────────────────────────────────────
  async issueTokens(
    user: TradingUser,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: AT_EXPIRE_SEC,
      }),

      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: RT_EXPIRE_SEC,
      }),
    ]);

    // RT → Redis 저장 (rt:{refreshToken} = userId)
    await this.redis.set(`${RT_PREFIX}${refreshToken}`, user.id, 'EX', RT_EXPIRE_SEC);

    return { accessToken, refreshToken };
  }

  // ─────────────────────────────────────────────
  // RT로 AT 재발급 (Silent Refresh)
  // ─────────────────────────────────────────────
  async refresh(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    // 1. RT 서명 검증
    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // 2. Redis에 존재하는지 확인 (강제 로그아웃 여부 체크)
    const storedUserId = await this.redis.get(`${RT_PREFIX}${refreshToken}`);
    if (!storedUserId) {
      throw new UnauthorizedException('Refresh token expired or revoked');
    }

    // 3. 유저 조회
    const user = await this.userRepo.findOne({ where: { id: payload.sub } });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // 4. RT Rotation: 기존 RT 삭제 후 새로 발급
    await this.redis.del(`${RT_PREFIX}${refreshToken}`);
    return this.issueTokens(user);
  }

  // ─────────────────────────────────────────────
  // 로그아웃 (RT Redis에서 삭제)
  // ─────────────────────────────────────────────
  async logout(refreshToken: string): Promise<void> {
    await this.redis.del(`${RT_PREFIX}${refreshToken}`);
  }

  // ─────────────────────────────────────────────
  // 유저 조회 (JwtStrategy에서 사용)
  // ─────────────────────────────────────────────
  async findById(id: string): Promise<TradingUser | null> {
    return this.userRepo.findOne({ where: { id, isActive: 1 } });
  }
}
