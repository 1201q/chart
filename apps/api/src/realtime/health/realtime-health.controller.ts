import { Controller, Get } from '@nestjs/common';
import { RealtimeHealthService } from './realtime-health.service';

@Controller('health')
export class RealtimeHealthController {
  constructor(private readonly realtimeHealth: RealtimeHealthService) {}

  @Get('realtime')
  getRealtimeHealth() {
    return this.realtimeHealth.getHealth();
  }
}
