import Decimal from 'decimal.js';
import {
  DashboardEventRow,
  PositionCostResult,
  RealizedPnlCalculationResult,
} from './dashboard-calculator.types';

function parseRawNumber(value: unknown) {
  if (typeof value !== 'string' && typeof value !== 'number') {
    return null;
  }

  const normalized = String(value).replace(/,/g, '');
  let parsed: Decimal;

  try {
    parsed = new Decimal(normalized || 0);
  } catch {
    return null;
  }

  return parsed.isFinite() ? parsed : null;
}

export function findIbkrRealizedPnl(rawData: unknown) {
  if (typeof rawData !== 'object' || rawData === null) {
    return null;
  }

  for (const [key, value] of Object.entries(rawData)) {
    if (key.includes('已实现') && key.includes('损益')) {
      return parseRawNumber(value);
    }
  }

  return null;
}

/**
 * 已实现盈亏来源选择器。
 *
 * IBKR CSV 的卖出交易 rawData 里通常带有“已实现的损益”。
 * 这个值已经考虑了券商真实成本基础、佣金、公司行动和外汇因素，
 * 所以优先使用；只有缺失时才回退到我们自己的 FIFO 结果。
 */
export function calculateRealizedPnlSource(
  events: DashboardEventRow[],
  positionCost: PositionCostResult,
): RealizedPnlCalculationResult {
  const bySymbol = new Map<string, Decimal>();
  let realizedPnlFromDb = new Decimal(0);
  let dbValueCount = 0;

  for (const event of events) {
    if (event.eventType !== 'TRADE_SELL' || !event.symbol) {
      continue;
    }

    const rawRealizedPnl = findIbkrRealizedPnl(event.rawData);
    if (rawRealizedPnl === null) {
      continue;
    }

    dbValueCount += 1;
    realizedPnlFromDb = realizedPnlFromDb.plus(rawRealizedPnl);
    bySymbol.set(
      event.symbol,
      (bySymbol.get(event.symbol) ?? new Decimal(0)).plus(rawRealizedPnl),
    );
  }

  if (dbValueCount > 0) {
    return {
      realizedPnl: realizedPnlFromDb,
      realizedPnlFromDb,
      realizedPnlFromFifo: positionCost.totalRealizedPnl,
      bySymbol,
      source: 'IBKR_RAW_DATA',
      warnings: [],
    };
  }

  return {
    realizedPnl: positionCost.totalRealizedPnl,
    realizedPnlFromDb: null,
    realizedPnlFromFifo: positionCost.totalRealizedPnl,
    bySymbol: new Map(
      positionCost.positions.map((position) => [
        position.symbol,
        position.realizedPnl,
      ]),
    ),
    source: 'FIFO',
    warnings: [
      '当前交易记录没有 IBKR 已实现损益字段，realizedPnl 已回退到 FIFO 计算结果。',
    ],
  };
}
