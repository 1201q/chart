import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { TradingUser } from 'src/trading/entities/trading-user.entity';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): TradingUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
