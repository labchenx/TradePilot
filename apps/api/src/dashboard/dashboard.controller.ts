import { Controller, Get, Query } from '@nestjs/common';
import { AssetTrendRange } from './dto/asset-trend.dto';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  getSummary() {
    return this.dashboardService.getSummary();
  }

  @Get('asset-trend')
  getAssetTrend(@Query('range') range?: AssetTrendRange) {
    return this.dashboardService.getAssetTrend(range);
  }

  @Get('allocation')
  getAllocation() {
    return this.dashboardService.getAllocation();
  }

  @Get('return-breakdown')
  getReturnBreakdown() {
    return this.dashboardService.getReturnBreakdown();
  }

  @Get('realized-pnl-by-symbol')
  getRealizedPnlBySymbol() {
    return this.dashboardService.getRealizedPnlBySymbol();
  }

  @Get('recent-trades')
  getRecentTrades() {
    return this.dashboardService.getRecentTrades();
  }
}
