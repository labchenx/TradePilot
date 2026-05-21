import { IsIn, IsOptional, IsString } from 'class-validator';

export type TradingBehaviorRange = '1M' | '3M' | 'YTD' | 'ALL';

export class GetTradingBehaviorDto {
  @IsOptional()
  @IsIn(['1M', '3M', 'YTD', 'ALL'])
  range?: TradingBehaviorRange = 'ALL';

  @IsOptional()
  @IsString()
  symbol?: string;
}
