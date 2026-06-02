import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import Decimal from 'decimal.js';
import { toPlainNumber } from '../dashboard/calculators/dashboard-decimal.util';
import { PrismaService } from '../prisma/prisma.service';
import {
  PortfolioHoldingItem,
  PortfolioPositionsService,
} from './portfolio-positions.service';
import {
  PortfolioTransactionItem,
  PortfolioTransactionsService,
} from './portfolio-transactions.service';

const DEFAULT_USER_ID = 'default_user';
const DEFAULT_ACCOUNT_ID = 'ALL';

export type StockDetailTrendRange = '1M' | '3M' | '6M' | '1Y';

export interface StockPriceTrendPoint {
  date: string;
  price: number;
  currency: string;
  source: 'PRICE_HISTORY' | 'POSITION_SNAPSHOT';
}

export interface StockDetailResponse {
  symbol: string;
  holding: PortfolioHoldingItem | null;
  priceTrend: StockPriceTrendPoint[];
  transactions: PortfolioTransactionItem[];
  warnings: string[];
  updatedAt: string;
}

function normalizeSymbol(symbol: string) {
  return symbol.trim().toUpperCase();
}

function normalizeTrendRange(range?: string): StockDetailTrendRange {
  return ['1M', '3M', '6M', '1Y'].includes(range ?? '')
    ? (range as StockDetailTrendRange)
    : '6M';
}

function rangeStart(range: StockDetailTrendRange, now = new Date()) {
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const monthsByRange: Record<StockDetailTrendRange, number> = {
    '1M': 1,
    '3M': 3,
    '6M': 6,
    '1Y': 12,
  };

  start.setUTCMonth(start.getUTCMonth() - monthsByRange[range]);
  return start;
}

function toDateOnly(value: Date) {
  return value.toISOString().slice(0, 10);
}

function snapshotMonthDate(month: string) {
  return `${month}-01`;
}

@Injectable()
export class PortfolioStockDetailService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly portfolioPositionsService: PortfolioPositionsService,
    private readonly portfolioTransactionsService: PortfolioTransactionsService,
  ) {}

  private async findPriceTrend(
    userId: string,
    symbol: string,
    range?: string,
  ): Promise<StockPriceTrendPoint[]> {
    const normalizedRange = normalizeTrendRange(range);
    const startDate = rangeStart(normalizedRange);
    const history = await this.prisma.priceHistory.findMany({
      where: {
        symbol,
        date: { gte: startDate },
      },
      orderBy: { date: 'asc' },
    });

    if (history.length > 0) {
      return history.map((row) => ({
        date: toDateOnly(row.date),
        price: toPlainNumber(
          new Decimal((row.adjustedClose ?? row.close).toString()),
        ),
        currency: row.currency,
        source: 'PRICE_HISTORY',
      }));
    }

    // Use monthly snapshots as a persisted fallback when daily history is empty.
    const startMonth = startDate.toISOString().slice(0, 7);
    const snapshots = await this.prisma.positionMonthlySnapshot.findMany({
      where: {
        userId,
        accountId: DEFAULT_ACCOUNT_ID,
        symbol,
        month: { gte: startMonth },
        marketPrice: { not: null },
      },
      orderBy: { month: 'asc' },
    });

    return snapshots.map((row) => ({
      date: snapshotMonthDate(row.month),
      price: toPlainNumber(
        new Decimal((row.marketPrice as Prisma.Decimal).toString()),
      ),
      currency: row.currency,
      source: 'POSITION_SNAPSHOT',
    }));
  }

  /**
   * Stock detail is an aggregation API: holding, trade history, and price trend
   * are all read from persisted portfolio / market-data layers.
   */
  async getStockDetail(
    userId = DEFAULT_USER_ID,
    inputSymbol: string,
    range?: string,
  ): Promise<StockDetailResponse> {
    const symbol = normalizeSymbol(inputSymbol);
    const [positions, transactionResult, priceTrend] = await Promise.all([
      this.portfolioPositionsService.getPositions(userId),
      this.portfolioTransactionsService.listTransactionItems({
        userId,
        symbol,
      }),
      this.findPriceTrend(userId, symbol, range),
    ]);
    const holding =
      positions.holdings.find((item) => item.symbol === symbol) ?? null;
    const warnings = Array.from(
      new Set([
        ...(positions.warnings ?? []),
        ...(transactionResult.warnings ?? []),
        ...(holding?.warnings ?? []),
      ]),
    );

    return {
      symbol,
      holding,
      priceTrend,
      transactions: transactionResult.transactions,
      warnings,
      updatedAt: new Date().toISOString(),
    };
  }
}
