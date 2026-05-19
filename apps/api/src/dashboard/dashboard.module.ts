import { Module } from '@nestjs/common';
import { MarketDataModule } from '../market-data/market-data.module';
import { PortfolioModule } from '../portfolio/portfolio.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [MarketDataModule, PortfolioModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
