import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exception');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>() as any;
    const res = ctx.getResponse() as any;

    const method = req.method;
    const url = req.originalUrl || req.url;

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: any = (exception as any)?.message || 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const resp = exception.getResponse();
      message = typeof resp === 'string' ? resp : ((resp as any).message ?? resp);
    }

    this.logger.error(
      `${method} ${url} ${status} - ${JSON.stringify(message)}`,
      (exception as any)?.stack,
    );

    res.status(status).json({
      statusCode: status,
      path: url,
      message,
      timestamp: new Date().toISOString(),
    });
  }
}
