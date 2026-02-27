import { Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { TradingUser } from '../entities/trading-user.entity';
import { FavoritesService } from './favorites.service';

@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favorites: FavoritesService) {}

  @Get()
  @ApiBearerAuth()
  getMyFavorites(@CurrentUser() user: TradingUser) {
    return this.favorites.getMyFavorites(user.id);
  }

  @Post(':market')
  @ApiBearerAuth()
  toggle(@Param('market') market: string, @CurrentUser() user: TradingUser) {
    return this.favorites.toggle(user.id, market);
  }
}
