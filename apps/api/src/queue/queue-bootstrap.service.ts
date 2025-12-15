import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { QueueProducer } from './queue.producer';

@Injectable()
export class QueueBootstrapService implements OnModuleInit {
  private readonly logger = new Logger(QueueBootstrapService.name);

  constructor(private readonly producer: QueueProducer) { }

  async onModuleInit() { }
}
