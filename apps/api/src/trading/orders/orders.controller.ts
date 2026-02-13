import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderBodyDto, GetOrdersQueryDto } from './orders.dto';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { TradingUser } from '../entities/trading-user.entity';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @ApiBearerAuth()
  getMyOrders(@Query() query: GetOrdersQueryDto, @CurrentUser() user: TradingUser) {
    return this.ordersService.getMyOrders(query, user.id);
  }

  @Post('/create')
  @ApiBearerAuth()
  create(@Body() dto: CreateOrderBodyDto, @CurrentUser() user: TradingUser) {
    return this.ordersService.createOrder(dto, user.id);
  }

  @Post(':id/cancel')
  @ApiBearerAuth()
  cancelOrder(@Param('id') orderId: string, @CurrentUser() user: TradingUser) {
    return this.ordersService.cancelOrder(orderId, user.id);
  }
}
