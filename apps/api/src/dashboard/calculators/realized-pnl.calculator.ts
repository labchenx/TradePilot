import { RealizedPnlBySymbolDto } from '../dto/realized-pnl-by-symbol.dto';
import {
  PositionCostResult,
  RealizedPnlCalculationResult,
} from './dashboard-calculator.types';
import { toPlainNumber } from './dashboard-decimal.util';

/**
 * 单股已实现盈亏排行。
 *
 * 如果 IBKR rawData 提供“已实现的损益”，这里优先展示 IBKR 口径；
 * 否则才回退到 position calculator 的 FIFO 结果。
 */
export function calculateRealizedPnlBySymbol(
  positionCost: PositionCostResult,
  realizedPnlMetrics: RealizedPnlCalculationResult,
  limit?: number,
): RealizedPnlBySymbolDto[] {
  const rows = positionCost.positions
    .map((position) => {
      const realizedPnl =
        realizedPnlMetrics.bySymbol.get(position.symbol) ?? position.realizedPnl;

      return {
        symbol: position.symbol,
        realizedPnl: toPlainNumber(realizedPnl),
        realizedPnlPercent: position.totalAllocatedCost.eq(0)
          ? 0
          : toPlainNumber(realizedPnl.div(position.totalAllocatedCost)),
        totalSellProceeds: toPlainNumber(position.totalSellProceeds),
        totalAllocatedCost: toPlainNumber(position.totalAllocatedCost),
        soldQuantity: toPlainNumber(position.soldQuantity),
        remainingQuantity: toPlainNumber(position.remainingQuantity),
        remainingCost: toPlainNumber(position.remainingCost),
        averageCost: toPlainNumber(position.averageCost),
        tradeCount: position.tradeCount,
        method:
          realizedPnlMetrics.source === 'IBKR_RAW_DATA'
            ? ('IBKR' as const)
            : ('FIFO' as const),
      };
    })
    .filter(
      (item) =>
        item.realizedPnl !== 0 ||
        item.totalSellProceeds !== 0 ||
        item.totalAllocatedCost !== 0,
    )
    .sort((a, b) => b.realizedPnl - a.realizedPnl);

  // 首页曾经只取 Top 5，会让 SPY 这类已实现正收益但排序靠后的股票消失。
  // 默认返回全部 symbol，后续如果做“排行榜/分页”再由 Controller 明确传 limit。
  return typeof limit === 'number' ? rows.slice(0, limit) : rows;
}
