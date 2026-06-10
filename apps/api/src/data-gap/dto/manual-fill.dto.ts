import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

export class ManualFillTradeDto {
  @IsString()
  @IsNotEmpty()
  symbol!: string;

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  tradeDate!: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}(:\d{2})?$/)
  tradeTime?: string;

  @IsEnum(['BUY', 'SELL'])
  side!: 'BUY' | 'SELL';

  @IsNumber()
  @IsPositive({ message: 'quantity must be greater than 0' })
  quantity!: number;

  @IsNumber()
  @IsPositive({ message: 'price must be greater than 0' })
  price!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  commission?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  fee?: number;

  @IsString()
  @IsNotEmpty()
  currency!: string;

  @IsOptional()
  @IsString()
  accountId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  note?: string;

  @IsOptional()
  @IsEnum(['ADJUST_CASH', 'POSITION_ONLY'])
  cashAdjustmentMode?: 'ADJUST_CASH' | 'POSITION_ONLY' = 'ADJUST_CASH';
}
