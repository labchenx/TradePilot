import Decimal from 'decimal.js';
import { AllocationItemDto } from '../dto/allocation.dto';
import {
  CashCalculationResult,
  MarketValuationResult,
} from './dashboard-calculator.types';
import { toPlainNumber } from './dashboard-decimal.util';

function toPercent(value: Decimal | null, totalValue: Decimal) {
  if (value === null || totalValue.eq(0)) return 0;
  return toPlainNumber(value.div(totalValue));
}

/**
 * Allocation 持仓占比计算器。
 *
 * 股票部分优先使用当前行情市值；如果某个 symbol 缺少行情，该项返回 value: null。
 * 百分比只基于“可计算出来的市值 + 现金”计算，缺行情项会带 missingQuote 标记。
 */
export function calculateAllocation(
  cashMetrics: CashCalculationResult,
  marketValuation: MarketValuationResult,
): AllocationItemDto[] {
  const knownStockValue = marketValuation.items.reduce(
    (sum, item) => sum.plus(item.marketValue ?? new Decimal(0)),
    new Decimal(0),
  );
  // 持仓占比只展示股票持仓，不展示 Cash；因此百分比也只基于股票市值合计计算。
  const totalKnownValue = knownStockValue;

  const stockItems = marketValuation.items.map((item) => ({
    symbol: item.symbol,
    name: item.name ?? item.symbol,
    type: 'STOCK' as const,
    quantity: toPlainNumber(item.quantity),
    value: item.marketValue === null ? null : toPlainNumber(item.marketValue),
    percent: toPercent(item.marketValue, totalKnownValue),
    estimated: false,
    missingQuote: item.missingQuote,
    price: item.price === null ? null : toPlainNumber(item.price),
  }));

  return stockItems
    .filter((item) => item.value !== 0 || item.missingQuote)
    .sort((a, b) => {
      // 持仓占比列表按金额从大到小展示；行情缺失的 null 放到最后。
      const aValue = a.value ?? Number.NEGATIVE_INFINITY;
      const bValue = b.value ?? Number.NEGATIVE_INFINITY;
      return bValue - aValue;
    });
}
