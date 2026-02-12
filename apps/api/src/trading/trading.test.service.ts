import { Injectable } from '@nestjs/common';

// OAuth 기반 인증으로 전환 후 더 이상 admin 유저를 자동 생성하지 않음
// 최초 로그인 시 findOrCreateUser()에서 유저가 생성됨
// ADMIN 역할은 DB에서 직접 role = 'ADMIN'으로 변경
@Injectable()
export class TradingTestService {}
