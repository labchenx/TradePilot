import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { AssetTrendRange } from '../dashboard/dto/asset-trend.dto';
import { ListPortfolioTransactionsDto } from './dto/list-portfolio-transactions.dto';
import { MonthlySnapshotService } from './monthly-snapshot.service';
import { MonthlyTrendService } from './monthly-trend.service';
import { PortfolioCashFlowsService } from './portfolio-cash-flows.service';
import { PortfolioPositionsService } from './portfolio-positions.service';
import { PortfolioTransactionsService } from './portfolio-transactions.service';

interface RegenerateMonthlySnapshotsBody {
  accountId?: string;
  startMonth?: string;
}

@Controller('portfolio')
export class PortfolioController {
  constructor(
    private readonly monthlyTrendService: MonthlyTrendService,
    private readonly monthlySnapshotService: MonthlySnapshotService,
    private readonly portfolioPositionsService: PortfolioPositionsService,
    private readonly portfolioTransactionsService: PortfolioTransactionsService,
    private readonly portfolioCashFlowsService: PortfolioCashFlowsService,
  ) {}

  @Get('positions')
  getPositions() {
    return this.portfolioPositionsService.getPositions();
  }

  @Get('transactions')
  getTransactions(@Query() query: ListPortfolioTransactionsDto) {
    return this.portfolioTransactionsService.getTransactions(query);
  }

  @Get('cash-flows')
  getCashFlows() {
    return this.portfolioCashFlowsService.getCashFlows();
  }

  @Get('monthly-trend')
  getMonthlyTrend(
    @Query('range') range?: AssetTrendRange,
    @Query('accountId') accountId?: string,
  ) {
    return this.monthlyTrendService.getMonthlyTrend(range, accountId);
  }

  @Post('monthly-snapshots/regenerate')
  regenerateMonthlySnapshots(@Body() body: RegenerateMonthlySnapshotsBody) {
    if (body.startMonth) {
      return this.monthlySnapshotService.regenerateSnapshotsFromMonth(
        body.accountId,
        body.startMonth,
      );
    }

    return this.monthlySnapshotService.generateMonthlySnapshots(body.accountId);
  }
}
