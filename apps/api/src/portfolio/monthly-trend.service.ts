import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  assetTrendRanges,
  AssetTrendPointDto,
  AssetTrendRange,
} from '../dashboard/dto/asset-trend.dto';
import { toPlainNumber } from '../dashboard/calculators/dashboard-decimal.util';
import { PrismaService } from '../prisma/prisma.service';
import { MonthlySnapshotService } from './monthly-snapshot.service';

const DEFAULT_ACCOUNT_ID = 'ALL';
const DEFAULT_USER_ID = 'default_user';

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

function toNullableNumber(value: Prisma.Decimal | null) {
  return value === null ? null : toPlainNumber(value);
}

function hasCashReport(value: unknown) {
  if (typeof value !== 'object' || value === null) return false;

  const summary = value as { cashReport?: { cashBalance?: unknown } };
  return typeof summary.cashReport?.cashBalance === 'number';
}

@Injectable()
export class MonthlyTrendService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly monthlySnapshotService: MonthlySnapshotService,
  ) {}

  private async findSnapshotPoints(userId: string, accountId: string) {
    const [snapshots, importFiles] = await Promise.all([
      this.prisma.portfolioMonthlySnapshot.findMany({
        where: { userId, accountId },
        orderBy: { month: 'asc' },
      }),
      this.prisma.importFile.findMany({
        where: { userId },
        orderBy: [{ periodEnd: 'asc' }, { createdAt: 'asc' }],
      }),
    ]);

    const missingPriceRows = await this.prisma.positionMonthlySnapshot.findMany({
      where: {
        userId,
        accountId,
        marketPrice: null,
      },
      select: { month: true, symbol: true },
      orderBy: [{ month: 'asc' }, { symbol: 'asc' }],
    });
    const missingPriceWarnings = missingPriceRows.map(
      (row) => `${row.symbol} ${row.month} month-end close price is missing.`,
    );
    const missingPriceSymbolsByMonth = new Map<string, string[]>();

    for (const row of missingPriceRows) {
      const symbols = missingPriceSymbolsByMonth.get(row.month) ?? [];
      symbols.push(row.symbol);
      missingPriceSymbolsByMonth.set(row.month, symbols);
    }

    return {
      points: snapshots.map((snapshot) => {
        const missingPriceSymbols =
          missingPriceSymbolsByMonth.get(snapshot.month) ?? [];
        const hasCashReportAnchor = importFiles.some((file) => {
          const effectiveDate = file.periodEnd ?? file.createdAt;
          return (
            effectiveDate.getTime() <= snapshot.snapshotDate.getTime() &&
            hasCashReport(file.summary)
          );
        });
        const cashSource: NonNullable<AssetTrendPointDto['debug']>['cashSource'] =
          hasCashReportAnchor
            ? 'IBKR_CASH_REPORT_WITH_DELTA_EVENTS'
            : 'TRANSACTION_EVENTS_FALLBACK';
        const priceSource: NonNullable<AssetTrendPointDto['debug']>['priceSource'] =
          missingPriceSymbols.length > 0
            ? 'PRICE_HISTORY_CACHE_WITH_MISSING'
            : 'PRICE_HISTORY_CACHE';

        return {
          month: snapshot.month,
          date: snapshot.snapshotDate.toISOString().slice(0, 10),
          totalAssets: toNullableNumber(snapshot.totalAssets),
          stockMarketValue: toNullableNumber(snapshot.stockMarketValue),
          cashBalance: toPlainNumber(snapshot.cashBalance),
          netDeposit: toPlainNumber(snapshot.netDeposit),
          totalReturn: toNullableNumber(snapshot.totalReturn),
          totalPnl: toNullableNumber(snapshot.totalReturn),
          estimated: false,
          debug: {
            cashSource,
            priceSource,
            missingPriceSymbols,
          },
          warnings: missingPriceWarnings.filter((warning) =>
            warning.includes(` ${snapshot.month} `),
          ),
        };
      }),
      warnings: missingPriceWarnings,
    };
  }

  /**
   * 首页趋势图只读 portfolio_monthly_snapshots。
   *
   * 如果快照为空，第一次访问会触发生成；生成后后续访问就只读快照表，不再每次扫描
   * transaction_events。导入流程会主动调用 regenerateSnapshotsFromMonth 刷新受影响月份。
   */
  async getMonthlyTrend(
    userId = DEFAULT_USER_ID,
    range?: AssetTrendRange,
    accountId = DEFAULT_ACCOUNT_ID,
  ) {
    let result = await this.findSnapshotPoints(userId, accountId);

    if (result.points.length === 0) {
      await this.monthlySnapshotService.generateMonthlySnapshots(userId, accountId);
      result = await this.findSnapshotPoints(userId, accountId);
    }

    return filterAssetTrendPoints(result.points, range);
  }
}
