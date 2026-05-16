export interface RealizedPnlBySymbolDto {
  symbol: string;
  realizedPnl: number;
  realizedPnlPercent: number;
  totalSellProceeds: number;
  totalAllocatedCost: number;
  soldQuantity: number;
  remainingQuantity: number;
  remainingCost: number;
  averageCost: number;
  tradeCount: number;
  method: 'IBKR' | 'FIFO';
}
