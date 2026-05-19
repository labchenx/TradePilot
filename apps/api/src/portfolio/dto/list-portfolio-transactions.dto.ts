import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export type PortfolioTransactionSortBy =
  | 'date'
  | 'amount'
  | 'realizedPnl'
  | 'symbol';
export type PortfolioTransactionSortDirection = 'asc' | 'desc';
export type PortfolioTransactionSide = 'BUY' | 'SELL';

export class ListPortfolioTransactionsDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(['BUY', 'SELL'])
  side?: PortfolioTransactionSide;

  @IsOptional()
  @IsIn(['date', 'amount', 'realizedPnl', 'symbol'])
  sortBy?: PortfolioTransactionSortBy = 'date';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortDirection?: PortfolioTransactionSortDirection = 'desc';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  pageSize?: number = 50;
}
