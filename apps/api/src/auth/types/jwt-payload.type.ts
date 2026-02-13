import { UserRole } from 'src/trading/entities/trading-user.entity';

export interface JwtPayload {
  sub: string; // userId
  email: string;
  role: UserRole;
}
