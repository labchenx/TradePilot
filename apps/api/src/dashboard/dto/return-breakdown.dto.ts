export interface ReturnBreakdownDto {
  realizedPnl: number;
  unrealizedPnl: number | null;
  dividends: number;
  paymentInLieu: number;
  feesAndTaxes: number;
  total: number | null;
}
