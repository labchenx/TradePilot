export interface AllocationItemDto {
  symbol: string;
  name?: string;
  type: 'STOCK' | 'CASH';
  quantity?: number;
  value: number | null;
  percent: number;
  estimated: boolean;
  missingQuote?: boolean;
  price?: number | null;
}
