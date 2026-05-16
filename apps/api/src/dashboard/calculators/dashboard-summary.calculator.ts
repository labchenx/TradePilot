import Decimal from 'decimal.js';
import { DashboardSummaryDto } from '../dto/dashboard-summary.dto';
import {
  CashCalculationResult,
  MarketValuationResult,
  PositionCostResult,
  RealizedPnlCalculationResult,
} from './dashboard-calculator.types';
import { toPlainNumber } from './dashboard-decimal.util';
import { getDashboardExchangeRateConfigSummary } from './exchange-rate.util';

function toNullableNumber(value: Decimal | null) {
  return value === null ? null : toPlainNumber(value);
}

/**
 * Dashboard Summary 组合器。
 *
 * 这里不直接遍历 transaction_events，而是组合几个小计算器的结果：
 * cashMetrics 负责现金，positionCost 负责持仓，marketValuation 负责行情市值，
 * realizedPnlMetrics 负责选择 IBKR 原始已实现损益或 FIFO 备用结果。
 */
export function calculateDashboardSummary(
  cashMetrics: CashCalculationResult,
  positionCost: PositionCostResult,
  marketValuation: MarketValuationResult,
  realizedPnlMetrics: RealizedPnlCalculationResult,
  extraWarnings: string[] = [],
): DashboardSummaryDto {
  const positionsBySymbol = new Map(
    positionCost.positions.map((position) => [position.symbol, position]),
  );
  const stockMarketValue = marketValuation.stockMarketValue;
  const accruedDividend = new Decimal(cashMetrics.cashDebug.accruedDividend);
  const totalAssets =
    stockMarketValue === null
      ? null
      : stockMarketValue.plus(cashMetrics.cashBalance).plus(accruedDividend);
  const totalReturn =
    totalAssets === null ? null : totalAssets.minus(cashMetrics.netDeposit);

  // 首页简化收益率：总收益 / 净入金。它不是严格的 TWR/MWR。
  const returnRate =
    totalReturn === null || cashMetrics.netDeposit.eq(0)
      ? null
      : totalReturn.div(cashMetrics.netDeposit);

  const realizedNetIncome = realizedPnlMetrics.realizedPnl.plus(
    cashMetrics.realizedNetIncomeAdjustments,
  );
  const missingQuoteSymbols = marketValuation.items
    .filter((item) => item.missingQuote)
    .map((item) => item.symbol);
  const warnings = new Set([
    ...extraWarnings,
    ...cashMetrics.warnings,
    ...positionCost.warnings,
    ...marketValuation.warnings,
    ...realizedPnlMetrics.warnings,
  ]);

  if (missingQuoteSymbols.length > 0) {
    warnings.add(
      `以下持仓缺少行情：${missingQuoteSymbols.join(', ')}。总资产、股票市值、总收益和收益率已显示为 --，避免展示不完整数字。`,
    );
  }

  return {
    totalAssets: toNullableNumber(totalAssets),
    stockMarketValue: toNullableNumber(stockMarketValue),
    cashBalance: toPlainNumber(cashMetrics.cashBalance),
    accruedDividend: toPlainNumber(accruedDividend),
    netDeposit: toPlainNumber(cashMetrics.netDeposit),
    totalPnl: toNullableNumber(totalReturn),
    totalReturn: toNullableNumber(totalReturn),
    returnRate: toNullableNumber(returnRate),
    realizedPnl: toPlainNumber(realizedPnlMetrics.realizedPnl),
    realizedNetIncome: toPlainNumber(realizedNetIncome),
    estimated: {
      stockMarketValue: false,
      totalAssets: false,
      totalPnl: false,
      returnRate: false,
    },
    currencyBreakdown: cashMetrics.currencyBreakdown,
    exchangeRate: getDashboardExchangeRateConfigSummary(),
    marketData: {
      provider: 'YAHOO_FINANCE',
      missingQuoteSymbols,
    },
    debug: {
      cashDebug: cashMetrics.cashDebug,
      netDepositDebug: cashMetrics.netDepositDebug,
      positionDebug: marketValuation.items.map((item) => {
        const position = positionsBySymbol.get(item.symbol);

        return {
          symbol: item.symbol,
          quantity: toPlainNumber(item.quantity),
          remainingCost:
            position === undefined ? 0 : toPlainNumber(position.remainingCost),
          averageCost:
            position === undefined ? 0 : toPlainNumber(position.averageCost),
          quotePrice: item.price === null ? null : toPlainNumber(item.price),
          marketValue:
            item.marketValue === null ? null : toPlainNumber(item.marketValue),
          unrealizedPnl:
            item.marketValue === null || position === undefined
              ? null
              : toPlainNumber(item.marketValue.minus(position.remainingCost)),
        };
      }),
      realizedDebug: {
        realizedPnlFromDb:
          realizedPnlMetrics.realizedPnlFromDb === null
            ? null
            : toPlainNumber(realizedPnlMetrics.realizedPnlFromDb),
        realizedPnlFromFifo: toPlainNumber(
          realizedPnlMetrics.realizedPnlFromFifo,
        ),
        source: realizedPnlMetrics.source,
      },
    },
    warnings: Array.from(warnings),
  };
}
