import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';

// OAuth 기반 인증으로 전환 후 bootstrap에서 admin 유저를 생성하지 않음
// 최초 로그인(Google/Naver)은 AuthService.findOrCreateUser()에서 처리됨
// ADMIN 권한 부여는 DB에서 직접 TRADING_USER.ROLE = 'ADMIN' 으로 변경
@Injectable()
export class TradingBootstrapService implements OnModuleInit {
  private readonly logger = new Logger(TradingBootstrapService.name);

  constructor(private readonly ds: DataSource) {}

  async onModuleInit() {
    this.logger.log('✅ TradingBootstrapService initialized (OAuth mode)');
  }
}
