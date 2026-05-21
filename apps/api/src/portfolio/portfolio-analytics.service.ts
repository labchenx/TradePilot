import { Injectable } from '@nestjs/common';
import { CashFlowType, Prisma } from '@prisma/client';
import Decimal from 'decimal.js';
import { calculatePositionCost } from '../dashboard/calculators/position-calculator';
import { deduplicateDashboardEvents } from '../dashboard/calculators/deduplicate-events.util';
import {
  toDecimal,
  toPlainNumber,
} from '../dashboard/calculators/dashboard-decimal.util';
import { convertToDashboardCurrency } from '../dashboard/calculators/exchange-rate.util';
import { calculateRealizedPnlSource } from '../dashboard/calculators/realized-pnl-source.calculator';
import { DashboardEventRow } from '../dashboard/calculators/dashboard-calculator.types';
import { calculateCashMetrics } from '../dashboard/calculators/cash-calculator';
import { PrismaService } from '../prisma/prisma.service';
import {
  PortfolioHoldingItem,
  PortfolioPositionsService,
} from './portfolio-positions.service';

const DEFAULT_ACCOUNT_ID = 'ALL';
const EVENT_ORDER: Prisma.TransactionEventOrderByWithRelationInput[] = [
  { tradeDate: 'asc' },
  { rawRowIndex: 'asc' },
];

type CashFlowRow = Prisma.CashFlowGetPayload<object>;

export interface AnalyticsSummary {
  totalAssets: number | null;
  totalReturn: number | null;
  returnRate: number | null;
  realizedPnl: number;
  unrealizedPnl: number | null;
  netDeposit: number;
}

export interface AssetTrendPoint {
  month: string;
  date: string;
  totalAssets: number | null;
  netDeposit: number;
  totalReturn: number | null;
}

export interface AllocationItem {
  symbol: string;
  name?: string;
  marketValue: number | null;
  weight: number | null;
}

export interface PnlContributionItem {
  symbol: string;
  name?: string;
  realizedPnl: number;
  unrealizedPnl: number | null;
  totalPnl: number | null;
}

export interface RealizedVsUnrealized {
  realizedPnl: number;
  unrealizedPnl: number | null;
}

export interface MonthlyCashFlowPoint {
  month: string;
  deposits: number;
  withdrawals: number;
  netDepositChange: number;
}

export interface PortfolioAnalyticsResponse {
  summary: AnalyticsSummary;
  assetTrend: AssetTrendPoint[];
  allocation: AllocationItem[];
  pnlContribution: PnlContributionItem[];
  realizedVsUnrealized: RealizedVsUnrealized;
  monthlyCashFlows: MonthlyCashFlowPoint[];
  warnings: string[];
  updatedAt: string;
}

function toNullableNumber(value: Decimal | Prisma.Decimal | null) {
  return value === null ? null : toPlainNumber(new Decimal(value.toString()));
}

function dateOnly(value: Date) {
  return value.toISOString().slice(0, 10);
}

function monthKey(value: Date) {
  return value.toISOString().slice(0, 7);
}

function signedCashFlowAmount(row: CashFlowRow) {
  const amount = toDecimal(row.amount).abs();
  return row.type === CashFlowType.DEPOSIT ? amount : amount.negated();
}

function addConvertedCashFlow(
  current: Decimal,
  row: CashFlowRow,
  warnings: Set<string>,
) {
  const converted = convertToDashboardCurrency(
    signedCashFlowAmount(row),
    row.currency,
  );
  converted.warnings.forEach((warning) => warnings.add(warning));
  return current.plus(converted.amount);
}

function compareNullablePnl(
  left: PnlContributionItem,
  right: PnlContributionItem,
) {
  if (left.totalPnl === null && right.totalPnl === null) {
    return left.symbol.localeCompare(right.symbol);
  }
  if (left.totalPnl === null) return 1;
  if (right.totalPnl === null) return -1;
  return right.totalPnl - left.totalPnl;
}

@Injectable()
export class PortfolioAnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly portfolioPositionsService: PortfolioPositionsService,
  ) {}

  private async findEvents() {
    const [rows, importFiles] = await Promise.all([
      this.prisma.transactionEvent.findMany({
        orderBy: EVENT_ORDER,
      }),
      this.prisma.importFile.findMany({
        orderBy: [{ periodEnd: 'asc' }, { createdAt: 'asc' }],
      }),
    ]);
    const result = deduplicateDashboardEvents(rows);

    return {
      ...result,
      importFiles,
    };
  }

  private async findCashFlows() {
    return this.prisma.cashFlow.findMany({
      where: {
        type: { in: [CashFlowType.DEPOSIT, CashFlowType.WITHDRAWAL] },
      },
      orderBy: [{ flowDate: 'asc' }, { createdAt: 'asc' }],
    });
  }

  private async buildAssetTrend(warnings: Set<string>) {
    const [snapshots, missingPriceRows] = await Promise.all([
      this.prisma.portfolioMonthlySnapshot.findMany({
        where: { accountId: DEFAULT_ACCOUNT_ID },
        orderBy: { month: 'asc' },
      }),
      this.prisma.positionMonthlySnapshot.findMany({
        where: {
          accountId: DEFAULT_ACCOUNT_ID,
          marketPrice: null,
        },
        select: { month: true, symbol: true },
        orderBy: [{ month: 'asc' }, { symbol: 'asc' }],
      }),
    ]);

    if (snapshots.length === 0) {
      warnings.add(
        'No portfolio monthly snapshots found. Generate monthly snapshots to display the asset trend.',
      );
    }

    missingPriceRows.forEach((row) => {
      warnings.add(
        `${row.symbol} ${row.month} month-end close price is missing. Trend values for that month may be unavailable.`,
      );
    });

    return snapshots.map((snapshot) => ({
      month: snapshot.month,
      date: dateOnly(snapshot.snapshotDate),
      totalAssets: toNullableNumber(snapshot.totalAssets),
      netDeposit: toPlainNumber(snapshot.netDeposit),
      totalReturn: toNullableNumber(snapshot.totalReturn),
    }));
  }

  private buildMonthlyCashFlows(cashFlows: CashFlowRow[], warnings: Set<string>) {
    const points = new Map<
      string,
      { deposits: Decimal; withdrawals: Decimal; netDepositChange: Decimal }
    >();

    for (const row of cashFlows) {
      const month = monthKey(row.flowDate);
      const item =
        points.get(month) ?? {
          deposits: new Decimal(0),
          withdrawals: new Decimal(0),
          netDepositChange: new Decimal(0),
        };
      const converted = convertToDashboardCurrency(
        signedCashFlowAmount(row),
        row.currency,
      );
      converted.warnings.forEach((warning) => warnings.add(warning));

      if (row.type === CashFlowType.DEPOSIT) {
        item.deposits = item.deposits.plus(converted.amount);
      } else {
        item.withdrawals = item.withdrawals.plus(converted.amount);
      }

      item.netDepositChange = item.netDepositChange.plus(converted.amount);
      points.set(month, item);
    }

    return Array.from(points.entries()).map(([month, item]) => ({
      month,
      deposits: toPlainNumber(item.deposits),
      withdrawals: toPlainNumber(item.withdrawals),
      netDepositChange: toPlainNumber(item.netDepositChange),
    }));
  }

  private buildAllocation(holdings: PortfolioHoldingItem[]): AllocationItem[] {
    return holdings.map((holding) => ({
      symbol: holding.symbol,
      name: holding.name,
      marketValue: holding.marketValue,
      weight: holding.weight,
    }));
  }

  private buildPnlContribution(
    holdings: PortfolioHoldingItem[],
    realizedBySymbol: Map<string, Decimal>,
  ): PnlContributionItem[] {
    const holdingsBySymbol = new Map(
      holdings.map((holding) => [holding.symbol, holding]),
    );
    const symbols = new Set([
      ...holdings.map((holding) => holding.symbol),
      ...realizedBySymbol.keys(),
    ]);

    return Array.from(symbols)
      .map((symbol) => {
        const holding = holdingsBySymbol.get(symbol);
        const realizedPnl = realizedBySymbol.get(symbol) ?? new Decimal(0);
        const unrealizedPnl =
          holding?.unrealizedPnl === undefined
            ? new Decimal(0)
            : holding.unrealizedPnl === null
              ? null
              : new Decimal(holding.unrealizedPnl);
        const totalPnl =
          unrealizedPnl === null ? null : realizedPnl.plus(unrealizedPnl);

        return {
          symbol,
          name: holding?.name,
          realizedPnl: toPlainNumber(realizedPnl),
          unrealizedPnl:
            unrealizedPnl === null ? null : toPlainNumber(unrealizedPnl),
          totalPnl: totalPnl === null ? null : toPlainNumber(totalPnl),
        };
      })
      .sort(compareNullablePnl);
  }

  async getAnalytics(): Promise<PortfolioAnalyticsResponse> {
    const warnings = new Set<string>();
    const [positionData, eventResult, cashFlows] = await Promise.all([
      this.portfolioPositionsService.getPositions(),
      this.findEvents(),
      this.findCashFlows(),
    ]);
    const { events } = eventResult;
    eventResult.warnings.forEach((warning) => warnings.add(warning));
    positionData.warnings.forEach((warning) => warnings.add(warning));

    // 顶部收益概览需要和 Overview 首页保持一致，因此这里复用首页同一套现金口径。
    // 月度入金出金图仍然只读取 cash_flows，避免把交易、股息、税费混进资金流图。
    const cashMetrics = calculateCashMetrics(events, eventResult.importFiles);
    cashMetrics.warnings.forEach((warning) => warnings.add(warning));

    const positionCost = calculatePositionCost(events);
    positionCost.warnings.forEach((warning) => warnings.add(warning));

    const realizedPnlMetrics = calculateRealizedPnlSource(events, positionCost);
    realizedPnlMetrics.warnings.forEach((warning) => warnings.add(warning));

    const stockMarketValue =
      positionData.summary.totalMarketValue === null
        ? null
        : new Decimal(positionData.summary.totalMarketValue);
    const unrealizedPnl =
      positionData.summary.unrealizedPnl === null
        ? null
        : new Decimal(positionData.summary.unrealizedPnl);
    const totalAssets =
      stockMarketValue === null
        ? null
        : cashMetrics.cashBalance.plus(stockMarketValue);
    const totalReturn =
      totalAssets === null ? null : totalAssets.minus(cashMetrics.netDeposit);
    const returnRate =
      totalReturn === null || cashMetrics.netDeposit.eq(0)
        ? null
        : totalReturn.div(cashMetrics.netDeposit);

    const [assetTrend, monthlyCashFlows] = await Promise.all([
      this.buildAssetTrend(warnings),
      Promise.resolve(this.buildMonthlyCashFlows(cashFlows, warnings)),
    ]);
    const allocation = this.buildAllocation(positionData.holdings);
    const pnlContribution = this.buildPnlContribution(
      positionData.holdings,
      realizedPnlMetrics.bySymbol,
    );

    return {
      summary: {
        totalAssets: toNullableNumber(totalAssets),
        totalReturn: toNullableNumber(totalReturn),
        returnRate: toNullableNumber(returnRate),
        realizedPnl: toPlainNumber(realizedPnlMetrics.realizedPnl),
        unrealizedPnl: toNullableNumber(unrealizedPnl),
        netDeposit: toPlainNumber(cashMetrics.netDeposit),
      },
      assetTrend,
      allocation,
      pnlContribution,
      realizedVsUnrealized: {
        realizedPnl: toPlainNumber(realizedPnlMetrics.realizedPnl),
        unrealizedPnl: toNullableNumber(unrealizedPnl),
      },
      monthlyCashFlows,
      warnings: Array.from(warnings),
      updatedAt: new Date().toISOString(),
    };
  }
}
