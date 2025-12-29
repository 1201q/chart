import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto, GetOrdersQueryDto } from './orders.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  getMyOrders(@Query() query: GetOrdersQueryDto) {
    return this.ordersService.getMyOrders(query);
  }

  @Post('/create')
  create(@Body() dto: CreateOrderDto) {
    return this.ordersService.createOrder(dto);
  }

  @Post(':id/cancel')
  cancelOrder(@Param('id') orderId: string) {
    return this.ordersService.cancelOrder(orderId);
  }
}
