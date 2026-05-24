import { Module } from '@nestjs/common';
import { SettingsModule } from '../settings/settings.module';
import { HistoricalPriceService } from './historical-price.service';
import { MarketController } from './market.controller';
import { MarketMaintenanceService } from './market-maintenance.service';
import { QuoteCacheService } from './quote-cache.service';
import { QuoteService } from './quote-service';
import { EastMoneyProvider } from './eastmoney-provider';

@Module({
  imports: [SettingsModule],
  controllers: [MarketController],
  providers: [
    EastMoneyProvider,
    QuoteCacheService,
    QuoteService,
    HistoricalPriceService,
    MarketMaintenanceService,
  ],
  exports: [QuoteService, HistoricalPriceService, MarketMaintenanceService],
})
export class MarketDataModule {}
