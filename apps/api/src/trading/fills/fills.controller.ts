import { Controller, Get, Query } from '@nestjs/common';

import { FillsService } from './fills.service';
import { GetFillsQueryDto } from './fills.dto';

@Controller('fills')
export class FillsController {
  constructor(private readonly fills: FillsService) {}

  @Get()
  getMyFills(@Query() query: GetFillsQueryDto) {
    return this.fills.getMyFills(query);
  }
}
