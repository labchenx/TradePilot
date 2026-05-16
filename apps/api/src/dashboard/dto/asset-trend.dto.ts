export type AssetTrendRange = '1M' | '3M' | 'YTD' | '1Y' | 'ALL';

export const assetTrendRanges: AssetTrendRange[] = [
  '1M',
  '3M',
  'YTD',
  '1Y',
  'ALL',
];

export interface AssetTrendPointDto {
  month: string;
  totalAssets: number;
  netDeposit: number;
  totalPnl: number;
  estimated: boolean;
}
