import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderBodyDto, GetOrdersQueryDto } from './orders.dto';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { TradingUser } from '../entities/trading-user.entity';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  getMyOrders(@Query() query: GetOrdersQueryDto, @CurrentUser() user: TradingUser) {
    return this.ordersService.getMyOrders(query, user.id);
  }

  @Post('/create')
  create(@Body() dto: CreateOrderBodyDto, @CurrentUser() user: TradingUser) {
    return this.ordersService.createOrder(dto, user.id);
  }

  @Post(':id/cancel')
  cancelOrder(@Param('id') orderId: string, @CurrentUser() user: TradingUser) {
    return this.ordersService.cancelOrder(orderId, user.id);
  }
}
