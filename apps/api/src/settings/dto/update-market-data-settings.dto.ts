import { IsBoolean, IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { MarketDataProvider } from '@prisma/client';

export class UpdateMarketDataSettingsDto {
  @IsOptional()
  @IsEnum(MarketDataProvider)
  provider?: MarketDataProvider;

  @IsOptional()
  @IsBoolean()
  enableQuoteCache?: boolean;

  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(1440)
  quoteCacheTtlMinutes?: number;

  @IsOptional()
  @IsBoolean()
  enableHistoryCache?: boolean;
}
