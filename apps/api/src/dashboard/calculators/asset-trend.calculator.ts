import Decimal from 'decimal.js';
import {
  assetTrendRanges,
  AssetTrendPointDto,
  AssetTrendRange,
} from '../dto/asset-trend.dto';
import { DashboardEventRow } from './dashboard-calculator.types';
import { absDecimal, toDecimal, toPlainNumber } from './dashboard-decimal.util';
import { compareDashboardEventsByExecutionTime } from './event-sort.util';
import { convertToDashboardCurrency } from './exchange-rate.util';

interface MonthlyPosition {
  quantity: Decimal;
  cost: Decimal;
}

function getMonthKey(event: DashboardEventRow) {
  return event.tradeDate.toISOString().slice(0, 7);
}

function getStockCost(positions: Map<string, MonthlyPosition>) {
  return Array.from(positions.values()).reduce(
    (sum, position) => sum.plus(position.cost),
    new Decimal(0),
  );
}

function normalizeAssetTrendRange(range?: string): AssetTrendRange {
  return assetTrendRanges.includes(range as AssetTrendRange)
    ? (range as AssetTrendRange)
    : 'ALL';
}

function parseMonth(month: string) {
  const [year, monthIndex] = month.split('-').map(Number);
  return { year, monthIndex };
}

function formatMonth(year: number, monthIndex: number) {
  return `${year}-${String(monthIndex).padStart(2, '0')}`;
}

function subtractMonths(month: string, count: number) {
  const { year, monthIndex } = parseMonth(month);
  const totalMonths = year * 12 + monthIndex - 1 - count;
  const nextYear = Math.floor(totalMonths / 12);
  const nextMonth = (totalMonths % 12) + 1;
  return formatMonth(nextYear, nextMonth);
}

function getRangeStartMonth(range: AssetTrendRange, latestMonth: string) {
  if (range === 'ALL') return null;
  if (range === 'YTD') return `${parseMonth(latestMonth).year}-01`;

  const monthsByRange: Record<Exclude<AssetTrendRange, 'ALL' | 'YTD'>, number> =
    {
      '1M': 1,
      '3M': 3,
      '1Y': 12,
    };

  // 月度聚合下，1M 表示最新 1 个自然月，3M 表示最新 3 个自然月。
  return subtractMonths(latestMonth, monthsByRange[range] - 1);
}

function filterAssetTrendPoints(
  points: AssetTrendPointDto[],
  range?: string,
) {
  const normalizedRange = normalizeAssetTrendRange(range);

  if (normalizedRange === 'ALL' || points.length === 0) return points;

  const latestMonth = points[points.length - 1].month;
  const startMonth = getRangeStartMonth(normalizedRange, latestMonth);

  return startMonth
    ? points.filter((point) => point.month >= startMonth)
    : points;
}

/**
 * 负责 Dashboard 的 Asset Trend 资产走势。
 *
 * 当前没有历史行情，所以每个月的总资产使用：
 * 月末现金余额 + 月末剩余持仓成本。
 * 这只是成本口径估算，不代表真实历史市值走势。
 */
export function calculateAssetTrend(
  events: DashboardEventRow[],
  range?: string,
): AssetTrendPointDto[] {
  const positions = new Map<string, MonthlyPosition>();
  const monthlySnapshots = new Map<string, AssetTrendPointDto>();
  let cashBalance = new Decimal(0);
  let netDeposit = new Decimal(0);

  for (const event of [...events].sort(compareDashboardEventsByExecutionTime)) {
    const convertedNetAmount = convertToDashboardCurrency(
      toDecimal(event.netAmount),
      event.currency,
    ).amount;
    cashBalance = cashBalance.plus(convertedNetAmount);

    if (event.eventType === 'DEPOSIT' || event.eventType === 'WITHDRAWAL') {
      netDeposit = netDeposit.plus(convertedNetAmount);
    }

    if (
      event.symbol &&
      (event.eventType === 'TRADE_BUY' || event.eventType === 'TRADE_SELL')
    ) {
      const position = positions.get(event.symbol) ?? {
        quantity: new Decimal(0),
        cost: new Decimal(0),
      };
      positions.set(event.symbol, position);

      if (event.eventType === 'TRADE_BUY') {
        position.quantity = position.quantity.plus(
          absDecimal(event.absQuantity ?? event.quantity),
        );
        position.cost = position.cost.plus(convertedNetAmount.abs());
      } else {
        const sellQuantity = absDecimal(event.absQuantity ?? event.quantity);
        const averageCost = position.quantity.gt(0)
          ? position.cost.div(position.quantity)
          : new Decimal(0);
        const quantityForCost = Decimal.min(sellQuantity, position.quantity);
        const allocatedCost = quantityForCost.mul(averageCost);
        position.quantity = Decimal.max(position.quantity.minus(sellQuantity), 0);
        position.cost = Decimal.max(position.cost.minus(allocatedCost), 0);
      }
    }

    const month = getMonthKey(event);
    const totalAssets = cashBalance.plus(getStockCost(positions));
    monthlySnapshots.set(month, {
      month,
      totalAssets: toPlainNumber(totalAssets),
      netDeposit: toPlainNumber(netDeposit),
      totalPnl: toPlainNumber(totalAssets.minus(netDeposit)),
      estimated: true,
    });
  }

  const points = Array.from(monthlySnapshots.values()).sort((a, b) =>
    a.month.localeCompare(b.month),
  );

  return filterAssetTrendPoints(points, range);
}
