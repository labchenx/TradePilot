import { Module } from '@nestjs/common';
import { MarketDataModule } from '../market-data/market-data.module';
import { PortfolioModule } from '../portfolio/portfolio.module';
import { ImportConfirmService } from './import-confirm.service';
import { ImportDedupService } from './import-dedup.service';
import { ImportsController } from './imports.controller';
import { ImportsService } from './imports.service';

@Module({
  imports: [PortfolioModule, MarketDataModule],
  controllers: [ImportsController],
  providers: [ImportConfirmService, ImportDedupService, ImportsService],
  exports: [ImportsService],
})
export class ImportsModule {}
