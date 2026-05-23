import { Controller, Get, Query } from '@nestjs/common';
import { CurrentUserParam } from '../auth/current-user.decorator';
import { CurrentUser } from '../auth/auth.types';
import { AssetTrendRange } from './dto/asset-trend.dto';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  getSummary(@CurrentUserParam() user: CurrentUser) {
    return this.dashboardService.getSummary(user.id);
  }

  @Get('asset-trend')
  getAssetTrend(
    @CurrentUserParam() user: CurrentUser,
    @Query('range') range?: AssetTrendRange,
  ) {
    return this.dashboardService.getAssetTrend(user.id, range);
  }

  @Get('allocation')
  getAllocation(@CurrentUserParam() user: CurrentUser) {
    return this.dashboardService.getAllocation(user.id);
  }

  @Get('return-breakdown')
  getReturnBreakdown(@CurrentUserParam() user: CurrentUser) {
    return this.dashboardService.getReturnBreakdown(user.id);
  }

  @Get('realized-pnl-by-symbol')
  getRealizedPnlBySymbol(@CurrentUserParam() user: CurrentUser) {
    return this.dashboardService.getRealizedPnlBySymbol(user.id);
  }

  @Get('recent-trades')
  getRecentTrades(@CurrentUserParam() user: CurrentUser) {
    return this.dashboardService.getRecentTrades(user.id);
  }
}
