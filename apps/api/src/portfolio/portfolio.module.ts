import { Module } from '@nestjs/common';
import { MarketDataModule } from '../market-data/market-data.module';
import { MonthlySnapshotService } from './monthly-snapshot.service';
import { MonthlyTrendService } from './monthly-trend.service';
import { PortfolioController } from './portfolio.controller';
import { PortfolioPositionsService } from './portfolio-positions.service';

@Module({
  imports: [MarketDataModule],
  controllers: [PortfolioController],
  providers: [
    MonthlySnapshotService,
    MonthlyTrendService,
    PortfolioPositionsService,
  ],
  exports: [
    MonthlySnapshotService,
    MonthlyTrendService,
    PortfolioPositionsService,
  ],
})
export class PortfolioModule {}
