export interface HoldingsSummaryApiDto {
  numberOfHoldings: number;
  totalMarketValue: number | null;
  totalCost: number;
  unrealizedPnl: number | null;
  unrealizedReturnRate: number | null;
  warnings: string[];
}

export interface HoldingApiDto {
  symbol: string;
  name?: string;
  quantity: number;
  avgCost: number | null;
  marketPrice: number | null;
  costBasis: number;
  marketValue: number | null;
  unrealizedPnl: number | null;
  unrealizedReturnRate: number | null;
  weight: number | null;
  currency: string;
  warnings?: string[];
}

export interface HoldingAllocationApiDto {
  symbol: string;
  marketValue: number;
  weight: number;
}

export interface HoldingPnlApiDto {
  symbol: string;
  unrealizedPnl: number;
}

export interface HoldingsResponseApiDto {
  summary: HoldingsSummaryApiDto;
  holdings: HoldingApiDto[];
  allocation: HoldingAllocationApiDto[];
  pnlBySymbol: HoldingPnlApiDto[];
  updatedAt?: string;
  warnings?: string[];
}

export interface Holding extends HoldingApiDto {
  id: string;
  color: string;
}

export interface HoldingsData {
  summary: HoldingsSummaryApiDto;
  holdings: Holding[];
  allocation: Array<HoldingAllocationApiDto & { color: string }>;
  pnlBySymbol: HoldingPnlApiDto[];
  updatedAt?: string;
  warnings: string[];
}

export type HoldingSortKey =
  | 'marketValue'
  | 'unrealizedPnl'
  | 'unrealizedReturnRate'
  | 'weight'
  | 'symbol'
  | 'quantity';

export type SortDirection = 'asc' | 'desc';
