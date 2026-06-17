import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CurrentUserParam } from '../auth/current-user.decorator';
import { CurrentUser } from '../auth/auth.types';
import { AssetTrendRange } from '../dashboard/dto/asset-trend.dto';
import { GetTradingBehaviorDto } from './dto/get-trading-behavior.dto';
import { ListPortfolioTransactionsDto } from './dto/list-portfolio-transactions.dto';
import { UpdateTransactionSideDto } from './dto/update-transaction-side.dto';
import { MonthlySnapshotService } from './monthly-snapshot.service';
import { MonthlyTrendService } from './monthly-trend.service';
import { PortfolioAnalyticsService } from './portfolio-analytics.service';
import { PortfolioCashFlowsService } from './portfolio-cash-flows.service';
import { PortfolioClearDataService } from './portfolio-clear-data.service';
import { PortfolioPositionsService } from './portfolio-positions.service';
import { PortfolioStockDetailService } from './portfolio-stock-detail.service';
import { PortfolioTradingBehaviorService } from './portfolio-trading-behavior.service';
import { PortfolioTransactionsService } from './portfolio-transactions.service';

interface RegenerateMonthlySnapshotsBody {
  accountId?: string;
  startMonth?: string;
}

@Controller(['portfolio', 'api/portfolio'])
export class PortfolioController {
  constructor(
    private readonly monthlyTrendService: MonthlyTrendService,
    private readonly monthlySnapshotService: MonthlySnapshotService,
    private readonly portfolioPositionsService: PortfolioPositionsService,
    private readonly portfolioTransactionsService: PortfolioTransactionsService,
    private readonly portfolioCashFlowsService: PortfolioCashFlowsService,
    private readonly portfolioAnalyticsService: PortfolioAnalyticsService,
    private readonly portfolioStockDetailService: PortfolioStockDetailService,
    private readonly portfolioTradingBehaviorService: PortfolioTradingBehaviorService,
    private readonly portfolioClearDataService: PortfolioClearDataService,
  ) {}

  @Get('positions')
  getPositions(@CurrentUserParam() user: CurrentUser) {
    return this.portfolioPositionsService.getPositions(user.id);
  }

  @Get('transactions')
  getTransactions(
    @CurrentUserParam() user: CurrentUser,
    @Query() query: ListPortfolioTransactionsDto,
  ) {
    return this.portfolioTransactionsService.getTransactions(user.id, query);
  }

  @Patch('transactions/:id/side')
  updateTransactionSide(
    @CurrentUserParam() user: CurrentUser,
    @Param('id') id: string,
    @Body() body: UpdateTransactionSideDto,
  ) {
    return this.portfolioTransactionsService.updateTransactionSide(
      user.id,
      id,
      body.side,
    );
  }

  @Get('cash-flows')
  getCashFlows(@CurrentUserParam() user: CurrentUser) {
    return this.portfolioCashFlowsService.getCashFlows(user.id);
  }

  @Get('analytics')
  getAnalytics(@CurrentUserParam() user: CurrentUser) {
    return this.portfolioAnalyticsService.getAnalytics(user.id);
  }

  @Get('trading-behavior')
  getTradingBehavior(
    @CurrentUserParam() user: CurrentUser,
    @Query() query: GetTradingBehaviorDto,
  ) {
    return this.portfolioTradingBehaviorService.getTradingBehavior(user.id, query);
  }

  @Get('stocks/:symbol')
  getStockDetail(
    @CurrentUserParam() user: CurrentUser,
    @Param('symbol') symbol: string,
    @Query('range') range?: string,
  ) {
    return this.portfolioStockDetailService.getStockDetail(
      user.id,
      symbol,
      range,
    );
  }

  @Get('monthly-trend')
  getMonthlyTrend(
    @CurrentUserParam() user: CurrentUser,
    @Query('range') range?: AssetTrendRange,
    @Query('accountId') accountId?: string,
  ) {
    return this.monthlyTrendService.getMonthlyTrend(user.id, range, accountId);
  }

  @Post('monthly-snapshots/regenerate')
  regenerateMonthlySnapshots(
    @CurrentUserParam() user: CurrentUser,
    @Body() body: RegenerateMonthlySnapshotsBody,
  ) {
    if (body.startMonth) {
      return this.monthlySnapshotService.regenerateSnapshotsFromMonth(
        user.id,
        body.accountId,
        body.startMonth,
      );
    }

    return this.monthlySnapshotService.generateMonthlySnapshots(user.id, body.accountId);
  }

  @Post('regenerate-monthly-snapshots')
  regenerateMonthlySnapshotsAlias(
    @CurrentUserParam() user: CurrentUser,
    @Body() body: RegenerateMonthlySnapshotsBody,
  ) {
    return this.regenerateMonthlySnapshots(user, body);
  }

  @Post('recalculate-positions')
  async recalculatePositions(@CurrentUserParam() user: CurrentUser) {
    const data = await this.portfolioPositionsService.getPositions(user.id);
    return {
      success: true,
      positionsCount: data.holdings.length,
      warnings: data.warnings,
      runAt: new Date().toISOString(),
    };
  }

  @Post('recalculate-metrics')
  async recalculateMetrics(@CurrentUserParam() user: CurrentUser) {
    const data = await this.portfolioAnalyticsService.getAnalytics(user.id);
    return {
      success: true,
      summary: data.summary,
      warnings: data.warnings,
      runAt: new Date().toISOString(),
    };
  }

  @Post('clear-data')
  clearData(
    @CurrentUserParam() user: CurrentUser,
    @Body() body: { confirmation?: string },
  ) {
    return this.portfolioClearDataService.clearCurrentUserData(user.id, body);
  }
}
