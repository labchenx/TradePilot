import { Module } from '@nestjs/common';
import { MarketDataModule } from '../market-data/market-data.module';
import { MonthlySnapshotService } from './monthly-snapshot.service';
import { MonthlyTrendService } from './monthly-trend.service';
import { PortfolioAnalyticsService } from './portfolio-analytics.service';
import { PortfolioCashFlowsService } from './portfolio-cash-flows.service';
import { PortfolioApiController, PortfolioController } from './portfolio.controller';
import { PortfolioPositionsService } from './portfolio-positions.service';
import { PortfolioTradingBehaviorService } from './portfolio-trading-behavior.service';
import { PortfolioTransactionsService } from './portfolio-transactions.service';

@Module({
  imports: [MarketDataModule],
  controllers: [PortfolioController, PortfolioApiController],
  providers: [
    MonthlySnapshotService,
    MonthlyTrendService,
    PortfolioAnalyticsService,
    PortfolioCashFlowsService,
    PortfolioPositionsService,
    PortfolioTradingBehaviorService,
    PortfolioTransactionsService,
  ],
  exports: [
    MonthlySnapshotService,
    MonthlyTrendService,
    PortfolioAnalyticsService,
    PortfolioCashFlowsService,
    PortfolioPositionsService,
    PortfolioTradingBehaviorService,
    PortfolioTransactionsService,
  ],
})
export class PortfolioModule {}
