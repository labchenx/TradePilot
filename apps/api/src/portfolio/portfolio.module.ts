import { Module } from '@nestjs/common';
import { MarketDataModule } from '../market-data/market-data.module';
import { MonthlySnapshotService } from './monthly-snapshot.service';
import { MonthlyTrendService } from './monthly-trend.service';
import { PortfolioController } from './portfolio.controller';
import { PortfolioPositionsService } from './portfolio-positions.service';
import { PortfolioTransactionsService } from './portfolio-transactions.service';

@Module({
  imports: [MarketDataModule],
  controllers: [PortfolioController],
  providers: [
    MonthlySnapshotService,
    MonthlyTrendService,
    PortfolioPositionsService,
    PortfolioTransactionsService,
  ],
  exports: [
    MonthlySnapshotService,
    MonthlyTrendService,
    PortfolioPositionsService,
    PortfolioTransactionsService,
  ],
})
export class PortfolioModule {}
