import { Controller, Get } from '@nestjs/common';
import { RealtimeHealthService } from './realtime-health.service';
import { Public } from 'src/auth/decorators/public.decorator';

@Public()
@Controller('health')
export class RealtimeHealthController {
  constructor(private readonly realtimeHealth: RealtimeHealthService) {}

  @Get('realtime')
  getRealtimeHealth() {
    return this.realtimeHealth.getHealth();
  }
}
