import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@bull-board/express';
import { Queue } from 'bullmq';
import { getQueueToken } from '@nestjs/bullmq';
import { QUEUE } from './queue/queue.constants';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  app.use(cookieParser());

  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath('/admin/queues');

  const translateQ = app.get<Queue>(getQueueToken(QUEUE.CMC_TRANSLATE));
  const iconQ = app.get<Queue>(getQueueToken(QUEUE.ICON_UPLOAD));
  const orderQ = app.get<Queue>(getQueueToken(QUEUE.ORDER_MATCHING));
  const recoveryQ = app.get<Queue>(getQueueToken(QUEUE.CANDLE_RECOVERY));
  const candleInitQ = app.get<Queue>(getQueueToken(QUEUE.CANDLE_INIT));

  createBullBoard({
    serverAdapter,
    queues: [
      new BullMQAdapter(translateQ),
      new BullMQAdapter(iconQ),
      new BullMQAdapter(orderQ),
      new BullMQAdapter(recoveryQ),
      new BullMQAdapter(candleInitQ),
    ],
  });

  app.getHttpAdapter().getInstance().set('trust proxy', 1);
  app.getHttpAdapter().getInstance().use('/admin/queues', serverAdapter.getRouter());

  const config = new DocumentBuilder()
    .setTitle('Chart API')
    .setDescription('The Chart API description')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  app.enableCors({
    origin: [
      'http://localhost:3000',
      'https://chartraders.club',
      'https://www.chartraders.club',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // app.useGlobalFilters(new AllExceptionsFilter());
  // app.useGlobalInterceptors(new LoggingInterceptor());

  await app.listen(process.env.PORT ?? 8000);
}
bootstrap();
