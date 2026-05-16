import { Module } from '@nestjs/common';
import { QuoteCacheService } from './quote-cache.service';
import { QuoteService } from './quote-service';
import { YahooProvider } from './yahoo-provider';

@Module({
  providers: [YahooProvider, QuoteCacheService, QuoteService],
  exports: [QuoteService],
})
export class MarketDataModule {}
