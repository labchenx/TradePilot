import { ReturnBreakdownDto } from '../dto/return-breakdown.dto';
import {
  CashCalculationResult,
  MarketValuationResult,
  PositionCostResult,
  RealizedPnlCalculationResult,
} from './dashboard-calculator.types';
import { toPlainNumber } from './dashboard-decimal.util';

/**
 * Return Breakdown 收益构成计算器。
 *
 * 已实现盈亏来自 FIFO；股息、税费、利息和费用来自现金事件。
 * 接入行情后，如果所有持仓都有价格，可以计算未实现盈亏；若缺行情则返回 null。
 */
export function calculateReturnBreakdown(
  cashMetrics: CashCalculationResult,
  positionCost: PositionCostResult,
  marketValuation: MarketValuationResult,
  realizedPnlMetrics: RealizedPnlCalculationResult,
): ReturnBreakdownDto {
  const unrealizedPnl =
    marketValuation.stockMarketValue === null
      ? null
      : marketValuation.stockMarketValue.minus(positionCost.totalRemainingCost);
  const feesAndTaxes = cashMetrics.withholdingTax
    .plus(cashMetrics.debitInterest)
    .plus(cashMetrics.otherFee);
  const total =
    unrealizedPnl === null
      ? null
      : realizedPnlMetrics.realizedPnl
          .plus(unrealizedPnl)
          .plus(cashMetrics.dividends)
          .plus(cashMetrics.paymentInLieu)
          .plus(feesAndTaxes);

  return {
    realizedPnl: toPlainNumber(realizedPnlMetrics.realizedPnl),
    unrealizedPnl: unrealizedPnl === null ? null : toPlainNumber(unrealizedPnl),
    dividends: toPlainNumber(cashMetrics.dividends),
    paymentInLieu: toPlainNumber(cashMetrics.paymentInLieu),
    feesAndTaxes: toPlainNumber(feesAndTaxes),
    total: total === null ? null : toPlainNumber(total),
  };
}
