import { Controller, Get } from '@nestjs/common';
import { PositionsService } from './positions.service';

@Controller('positions')
export class PositionsController {
  constructor(private readonly positions: PositionsService) {}

  @Get()
  getMyPositions() {
    return this.positions.getMyPositions();
  }
}
