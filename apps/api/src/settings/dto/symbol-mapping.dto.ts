import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { MarketDataProvider } from '@prisma/client';

export class ListSymbolMappingsDto {
  @IsOptional()
  @IsString()
  search?: string;
}

export class CreateSymbolMappingDto {
  @IsString()
  @MaxLength(32)
  sourceSymbol!: string;

  @IsString()
  @MaxLength(32)
  targetSymbol!: string;

  @IsOptional()
  @IsEnum(MarketDataProvider)
  provider?: MarketDataProvider;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  note?: string;
}

export class UpdateSymbolMappingDto {
  @IsOptional()
  @IsString()
  @MaxLength(32)
  sourceSymbol?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  targetSymbol?: string;

  @IsOptional()
  @IsEnum(MarketDataProvider)
  provider?: MarketDataProvider;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  note?: string;
}
