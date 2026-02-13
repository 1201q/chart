import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GoogleStrategy } from './strategies/google.strategy';
import { NaverStrategy } from './strategies/naver.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { TradingUser } from 'src/trading/entities/trading-user.entity';

@Module({
  imports: [
    ConfigModule,
    PassportModule,
    JwtModule.register({}), // !! signAsync 시 직접 secret 전달하므로 기본값 비워둠
    TypeOrmModule.forFeature([TradingUser]),
  ],
  controllers: [AuthController],
  providers: [AuthService, GoogleStrategy, NaverStrategy, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
