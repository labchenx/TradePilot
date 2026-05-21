import Decimal from 'decimal.js';
import {
  DashboardEventRow,
  PositionCostItem,
  PositionCostResult,
} from './dashboard-calculator.types';
import { absDecimal, toDecimal } from './dashboard-decimal.util';
import { convertToDashboardCurrency } from './exchange-rate.util';

interface PositionLot {
  quantity: Decimal;
  cost: Decimal;
  source: string;
}

interface MutablePosition {
  symbol: string;
  lots: PositionLot[];
  remainingQuantity: Decimal;
  remainingCost: Decimal;
  realizedPnl: Decimal;
  totalSellProceeds: Decimal;
  totalAllocatedCost: Decimal;
  soldQuantity: Decimal;
  tradeCount: number;
}

const LOT_OPEN_EVENT_TYPES = [
  'TRADE_BUY',
  'STOCK_GRANT',
  'STOCK_DIVIDEND',
  'TRANSFER_IN',
] as const;

const LOT_CLOSE_EVENT_TYPES = ['TRADE_SELL', 'TRANSFER_OUT'] as const;
const VESTED_STOCK_GRANT_DESCRIPTION = '\u80a1\u7968\u5956\u52b1\u5151\u73b0';

function createPosition(symbol: string): MutablePosition {
  return {
    symbol,
    lots: [],
    remainingQuantity: new Decimal(0),
    remainingCost: new Decimal(0),
    realizedPnl: new Decimal(0),
    totalSellProceeds: new Decimal(0),
    totalAllocatedCost: new Decimal(0),
    soldQuantity: new Decimal(0),
    tradeCount: 0,
  };
}

function sortEvents(a: DashboardEventRow, b: DashboardEventRow) {
  const dateDiff = a.tradeDate.getTime() - b.tradeDate.getTime();
  return dateDiff === 0 ? a.rawRowIndex - b.rawRowIndex : dateDiff;
}

function sumLotQuantity(lots: PositionLot[]) {
  return lots.reduce((sum, lot) => sum.plus(lot.quantity), new Decimal(0));
}

function sumLotCost(lots: PositionLot[]) {
  return lots.reduce((sum, lot) => sum.plus(lot.cost), new Decimal(0));
}

function toPositionItem(position: MutablePosition): PositionCostItem {
  const averageCost = position.remainingQuantity.gt(0)
    ? position.remainingCost.div(position.remainingQuantity)
    : new Decimal(0);

  return {
    symbol: position.symbol,
    remainingQuantity: position.remainingQuantity,
    remainingCost: position.remainingCost,
    averageCost,
    realizedPnl: position.realizedPnl,
    totalSellProceeds: position.totalSellProceeds,
    totalAllocatedCost: position.totalAllocatedCost,
    soldQuantity: position.soldQuantity,
    tradeCount: position.tradeCount,
    method: 'FIFO',
  };
}

function allocateFifoCost(position: MutablePosition, quantity: Decimal) {
  let remainingToAllocate = Decimal.min(quantity, position.remainingQuantity);
  let allocatedCost = new Decimal(0);

  while (remainingToAllocate.gt(0) && position.lots.length > 0) {
    const lot = position.lots[0];
    const quantityFromLot = Decimal.min(remainingToAllocate, lot.quantity);
    const costFromLot = lot.cost.mul(quantityFromLot).div(lot.quantity);

    allocatedCost = allocatedCost.plus(costFromLot);
    lot.quantity = lot.quantity.minus(quantityFromLot);
    lot.cost = lot.cost.minus(costFromLot);
    remainingToAllocate = remainingToAllocate.minus(quantityFromLot);

    if (lot.quantity.lte(0)) {
      position.lots.shift();
    }
  }

  return allocatedCost;
}

function parseSplitRatio(event: DashboardEventRow): Decimal | null {
  const rawData = event.rawData as Record<string, unknown>;
  const description = String(rawData?.['描述'] ?? event.description ?? '');
  const match = description.match(/(?:拆股|合股)\s+([0-9.]+)\s*-\s*([0-9.]+)/);

  if (!match) {
    return null;
  }

  const first = new Decimal(match[1]);
  const second = new Decimal(match[2]);

  if (first.lte(0) || second.lte(0)) {
    return null;
  }

  return first.div(second);
}

function getOpenLotCost(event: DashboardEventRow) {
  if (event.eventType === 'TRADE_BUY') {
    return convertToDashboardCurrency(toDecimal(event.netAmount), event.currency)
      .amount.abs();
  }

  // 股票奖励、送股、转入优先使用 IBKR 给出的 cost basis。
  // 当前统一落在 grossAmount 上；没有值时使用 0。
  return convertToDashboardCurrency(toDecimal(event.grossAmount), event.currency)
    .amount.abs();
}

function shouldOpenLot(event: DashboardEventRow) {
  if (event.eventType !== 'STOCK_GRANT') {
    return true;
  }

  // IBKR reports the same bonus-share lifecycle in multiple rows:
  // grant -> vesting -> withholding tax. The vesting row confirms status
  // for shares that were already granted, so counting it again inflates
  // the current position.
  return !event.description.includes(VESTED_STOCK_GRANT_DESCRIPTION);
}

/**
 * 持仓和 lot 计算器。
 *
 * 维护 adjusted lots：
 * - BUY / STOCK_GRANT / STOCK_DIVIDEND / TRANSFER_IN 生成 lot
 * - SELL / TRANSFER_OUT 按 FIFO 扣减 lot
 * - SPLIT / REVERSE_SPLIT 调整所有未平仓 lot 的 quantity，cost basis 不变
 */
export function calculatePositionCost(
  events: DashboardEventRow[],
): PositionCostResult {
  const positions = new Map<string, MutablePosition>();
  const warnings: string[] = [];
  const conversionWarnings = new Set<string>();

  const relevantEvents = events
    .filter((event) => event.symbol)
    .filter((event) =>
      [
        ...LOT_OPEN_EVENT_TYPES,
        ...LOT_CLOSE_EVENT_TYPES,
        'SPLIT',
        'REVERSE_SPLIT',
        'ADJUSTMENT',
        'UNKNOWN',
      ].includes(event.eventType),
    )
    .sort(sortEvents);

  for (const event of relevantEvents) {
    const symbol = event.symbol as string;
    const position = positions.get(symbol) ?? createPosition(symbol);
    positions.set(symbol, position);

    if (LOT_OPEN_EVENT_TYPES.includes(event.eventType as never)) {
      if (!shouldOpenLot(event)) {
        continue;
      }

      if (event.eventType === 'TRADE_BUY') {
        position.tradeCount += 1;
      }

      const quantity = absDecimal(event.absQuantity ?? event.quantity);
      const cost = getOpenLotCost(event);

      if (
        event.eventType === 'TRANSFER_IN' &&
        cost.eq(0) &&
        quantity.gt(0)
      ) {
        warnings.push(
          `${symbol} transfer-in is missing cost basis on ${event.tradeDate.toISOString().slice(0, 10)}. Cost and P/L may be inaccurate.`,
        );
      }

      position.lots.push({
        quantity,
        cost,
        source: event.eventType,
      });
      position.remainingQuantity = position.remainingQuantity.plus(quantity);
      position.remainingCost = position.remainingCost.plus(cost);
      continue;
    }

    if (LOT_CLOSE_EVENT_TYPES.includes(event.eventType as never)) {
      if (event.eventType === 'TRADE_SELL') {
        position.tradeCount += 1;
      }

      const quantity = absDecimal(event.absQuantity ?? event.quantity);
      const convertedNetAmount = convertToDashboardCurrency(
        toDecimal(event.netAmount),
        event.currency,
      );
      convertedNetAmount.warnings.forEach((warning) =>
        conversionWarnings.add(warning),
      );

      if (quantity.gt(position.remainingQuantity)) {
        const closeLabel =
          event.eventType === 'TRADE_SELL' ? 'sell' : 'transfer-out';
        warnings.push(
          `${symbol} ${closeLabel} quantity ${quantity.toString()} is greater than current lot quantity ${position.remainingQuantity.toString()}. Please review missing opening positions or corporate actions.`,
        );
      }

      const allocatedCost = allocateFifoCost(position, quantity);
      const quantityForPosition = Decimal.min(quantity, position.remainingQuantity);

      if (event.eventType === 'TRADE_SELL') {
        const realizedPnl = convertedNetAmount.amount.minus(allocatedCost);
        position.realizedPnl = position.realizedPnl.plus(realizedPnl);
        position.totalSellProceeds = position.totalSellProceeds.plus(
          convertedNetAmount.amount,
        );
        position.totalAllocatedCost =
          position.totalAllocatedCost.plus(allocatedCost);
        position.soldQuantity = position.soldQuantity.plus(quantity);
      }

      position.remainingQuantity = Decimal.max(
        position.remainingQuantity.minus(quantityForPosition),
        0,
      );
      position.remainingCost = Decimal.max(
        position.remainingCost.minus(allocatedCost),
        0,
      );
      continue;
    }

    if (event.eventType === 'SPLIT' || event.eventType === 'REVERSE_SPLIT') {
      const splitRatio = parseSplitRatio(event);

      if (!splitRatio) {
        warnings.push(
          `${symbol} split ratio could not be parsed on ${event.tradeDate.toISOString().slice(0, 10)}: ${event.description}`,
        );
        continue;
      }

      position.lots = position.lots.map((lot) => ({
        ...lot,
        // 拆股/合股只改变数量；cost basis 保持不变。
        quantity: lot.quantity.mul(splitRatio),
      }));
      position.remainingQuantity = sumLotQuantity(position.lots);
      position.remainingCost = sumLotCost(position.lots);
      continue;
    }

    warnings.push(
      `${symbol} corporate action could not be recognized on ${event.tradeDate.toISOString().slice(0, 10)}: ${event.eventType}`,
    );
  }

  for (const position of positions.values()) {
    const lotQuantity = sumLotQuantity(position.lots);
    if (!lotQuantity.minus(position.remainingQuantity).abs().lte(0.000001)) {
      warnings.push(
        `${position.symbol} lot quantity ${lotQuantity.toString()} does not match remaining quantity ${position.remainingQuantity.toString()}.`,
      );
    }
  }

  const positionItems = Array.from(positions.values()).map(toPositionItem);

  return {
    positions: positionItems,
    totalRemainingCost: positionItems.reduce(
      (sum, item) => sum.plus(item.remainingCost),
      new Decimal(0),
    ),
    totalRealizedPnl: positionItems.reduce(
      (sum, item) => sum.plus(item.realizedPnl),
      new Decimal(0),
    ),
    warnings: [...conversionWarnings, ...warnings],
  };
}
