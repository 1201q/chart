import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    const now = Date.now();
    const req = context.switchToHttp().getRequest<Request>() as any;

    const method = req.method;
    const url = req.originalUrl || req.url;
    const ip = req.ip || req.connection?.remoteAddress;

    return next.handle().pipe(
      tap(() => {
        const ms = Date.now() - now;
        const status = (req.res && (req.res as any).statusCode) || 0;

        this.logger.log(`${method} ${url} ${status} +${ms}ms - ip=${ip}`);
      }),
    );
  }
}
