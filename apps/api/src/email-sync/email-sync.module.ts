import { Module } from '@nestjs/common';
import { MarketDataModule } from '../market-data/market-data.module';
import { PortfolioModule } from '../portfolio/portfolio.module';
import { EmailSyncController } from './email-sync.controller';
import { EmailSyncService } from './email-sync.service';

@Module({
  imports: [PortfolioModule, MarketDataModule],
  controllers: [EmailSyncController],
  providers: [EmailSyncService],
})
export class EmailSyncModule {}
