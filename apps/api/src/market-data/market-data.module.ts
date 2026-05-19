import { Module } from '@nestjs/common';
import { HistoricalPriceService } from './historical-price.service';
import { QuoteCacheService } from './quote-cache.service';
import { QuoteService } from './quote-service';
import { YahooProvider } from './yahoo-provider';

@Module({
  providers: [YahooProvider, QuoteCacheService, QuoteService, HistoricalPriceService],
  exports: [QuoteService, HistoricalPriceService],
})
export class MarketDataModule {}
