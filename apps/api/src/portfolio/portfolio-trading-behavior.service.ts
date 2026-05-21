import { Injectable } from '@nestjs/common';
import Decimal from 'decimal.js';
import { toPlainNumber } from '../dashboard/calculators/dashboard-decimal.util';
import {
  GetTradingBehaviorDto,
  TradingBehaviorRange,
} from './dto/get-trading-behavior.dto';
import {
  PortfolioTransactionItem,
  PortfolioTransactionsService,
} from './portfolio-transactions.service';

export interface TradingBehaviorSummary {
  totalTrades: number;
  buyTrades: number;
  sellTrades: number;
  tradedSymbolCount: number;
  totalCommission: number;
  realizedPnl: number;
  avgTradeAmount: number | null;
  winRate: number | null;
}

export interface MonthlyTradeCount {
  month: string;
  buyCount: number;
  sellCount: number;
  totalCount: number;
}

export interface MonthlyTradeAmount {
  month: string;
  buyAmount: number;
  sellAmount: number;
  netBuyAmount: number;
}

export interface SymbolTradingStats {
  symbol: string;
  name?: string;
  tradeCount: number;
  buyCount: number;
  sellCount: number;
  buyAmount: number;
  sellAmount: number;
  commission: number;
  realizedPnl: number;
}

export interface RealizedPnlContribution {
  symbol: string;
  realizedPnl: number;
}

export interface TradingBehaviorResponse {
  summary: TradingBehaviorSummary;
  monthlyTradeCounts: MonthlyTradeCount[];
  monthlyTradeAmounts: MonthlyTradeAmount[];
  symbolStats: SymbolTradingStats[];
  realizedPnlContributions: RealizedPnlContribution[];
  warnings: string[];
  updatedAt: string;
}

interface MutableMonthlyBucket {
  month: string;
  buyCount: number;
  sellCount: number;
  buyAmount: Decimal;
  sellAmount: Decimal;
}

interface MutableSymbolBucket {
  symbol: string;
  name?: string;
  tradeCount: number;
  buyCount: number;
  sellCount: number;
  buyAmount: Decimal;
  sellAmount: Decimal;
  commission: Decimal;
  realizedPnl: Decimal;
}

function monthKey(date: string) {
  return date.slice(0, 7);
}

function absDecimal(value: number) {
  return new Decimal(value).abs();
}

function getRangeStartDate(range: TradingBehaviorRange, now = new Date()) {
  if (range === 'ALL') {
    return undefined;
  }

  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );

  if (range === '1M') {
    start.setUTCMonth(start.getUTCMonth() - 1);
    return start;
  }

  if (range === '3M') {
    start.setUTCMonth(start.getUTCMonth() - 3);
    return start;
  }

  return new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
}

function createMonthlyBucket(month: string): MutableMonthlyBucket {
  return {
    month,
    buyCount: 0,
    sellCount: 0,
    buyAmount: new Decimal(0),
    sellAmount: new Decimal(0),
  };
}

function createSymbolBucket(
  transaction: PortfolioTransactionItem,
): MutableSymbolBucket {
  return {
    symbol: transaction.symbol,
    name: transaction.name,
    tradeCount: 0,
    buyCount: 0,
    sellCount: 0,
    buyAmount: new Decimal(0),
    sellAmount: new Decimal(0),
    commission: new Decimal(0),
    realizedPnl: new Decimal(0),
  };
}

function buildWarnings(
  transactions: PortfolioTransactionItem[],
  sourceWarnings: string[],
) {
  const warnings = new Set(sourceWarnings);
  const sellMissingRealizedPnlCount = transactions.filter(
    (transaction) =>
      transaction.side === 'SELL' && transaction.realizedPnl === null,
  ).length;

  if (sellMissingRealizedPnlCount > 0) {
    warnings.add(
      `${sellMissingRealizedPnlCount} SELL trades are missing IBKR realizedPnl. Win rate skips them and no FIFO fallback is applied.`,
    );
  }

  return Array.from(warnings);
}

@Injectable()
export class PortfolioTradingBehaviorService {
  constructor(
    private readonly portfolioTransactionsService: PortfolioTransactionsService,
  ) {}

  /**
   * Trading Behavior is a read-only analytical API. It reuses the transaction
   * service so the page sees the same deduplicated BUY / SELL rows and the same
   * source-derived IBKR realizedPnl values as the Transactions detail page.
   */
  async getTradingBehavior(
    query: GetTradingBehaviorDto = {},
  ): Promise<TradingBehaviorResponse> {
    const range = query.range ?? 'ALL';
    const symbol = query.symbol?.trim();
    const { transactions, warnings: sourceWarnings } =
      await this.portfolioTransactionsService.listTransactionItems({
        symbol: symbol || undefined,
        startDate: getRangeStartDate(range),
      });
    const monthlyBuckets = new Map<string, MutableMonthlyBucket>();
    const symbolBuckets = new Map<string, MutableSymbolBucket>();
    const tradedSymbols = new Set<string>();
    let buyTrades = 0;
    let sellTrades = 0;
    let totalTradeAmount = new Decimal(0);
    let totalCommission = new Decimal(0);
    let realizedPnl = new Decimal(0);
    let winningSellTrades = 0;
    let sellTradesWithRealizedPnl = 0;

    for (const transaction of transactions) {
      const amount = absDecimal(transaction.amount);
      const commission = absDecimal(transaction.commission);
      const month = monthKey(transaction.date);
      const monthlyBucket =
        monthlyBuckets.get(month) ?? createMonthlyBucket(month);
      const symbolBucket =
        symbolBuckets.get(transaction.symbol) ?? createSymbolBucket(transaction);

      tradedSymbols.add(transaction.symbol);
      totalTradeAmount = totalTradeAmount.plus(amount);
      totalCommission = totalCommission.plus(commission);
      monthlyBucket.month = month;
      symbolBucket.name = symbolBucket.name ?? transaction.name;
      symbolBucket.tradeCount += 1;
      symbolBucket.commission = symbolBucket.commission.plus(commission);

      if (transaction.side === 'BUY') {
        buyTrades += 1;
        monthlyBucket.buyCount += 1;
        monthlyBucket.buyAmount = monthlyBucket.buyAmount.plus(amount);
        symbolBucket.buyCount += 1;
        symbolBucket.buyAmount = symbolBucket.buyAmount.plus(amount);
      } else {
        sellTrades += 1;
        monthlyBucket.sellCount += 1;
        monthlyBucket.sellAmount = monthlyBucket.sellAmount.plus(amount);
        symbolBucket.sellCount += 1;
        symbolBucket.sellAmount = symbolBucket.sellAmount.plus(amount);

        if (transaction.realizedPnl !== null) {
          const pnl = new Decimal(transaction.realizedPnl);
          realizedPnl = realizedPnl.plus(pnl);
          symbolBucket.realizedPnl = symbolBucket.realizedPnl.plus(pnl);
          sellTradesWithRealizedPnl += 1;

          if (pnl.gt(0)) {
            winningSellTrades += 1;
          }
        }
      }

      monthlyBuckets.set(month, monthlyBucket);
      symbolBuckets.set(transaction.symbol, symbolBucket);
    }

    const totalTrades = transactions.length;
    const monthlyTradeCounts = Array.from(monthlyBuckets.values())
      .sort((left, right) => left.month.localeCompare(right.month))
      .map((bucket) => ({
        month: bucket.month,
        buyCount: bucket.buyCount,
        sellCount: bucket.sellCount,
        totalCount: bucket.buyCount + bucket.sellCount,
      }));
    const monthlyTradeAmounts = Array.from(monthlyBuckets.values())
      .sort((left, right) => left.month.localeCompare(right.month))
      .map((bucket) => ({
        month: bucket.month,
        buyAmount: toPlainNumber(bucket.buyAmount),
        sellAmount: toPlainNumber(bucket.sellAmount),
        netBuyAmount: toPlainNumber(bucket.buyAmount.minus(bucket.sellAmount)),
      }));
    const symbolStats = Array.from(symbolBuckets.values())
      .map((bucket) => ({
        symbol: bucket.symbol,
        name: bucket.name,
        tradeCount: bucket.tradeCount,
        buyCount: bucket.buyCount,
        sellCount: bucket.sellCount,
        buyAmount: toPlainNumber(bucket.buyAmount),
        sellAmount: toPlainNumber(bucket.sellAmount),
        commission: toPlainNumber(bucket.commission),
        realizedPnl: toPlainNumber(bucket.realizedPnl),
      }))
      .sort((left, right) => {
        if (right.tradeCount !== left.tradeCount) {
          return right.tradeCount - left.tradeCount;
        }

        return left.symbol.localeCompare(right.symbol);
      });
    const realizedPnlContributions = symbolStats
      .map((stats) => ({
        symbol: stats.symbol,
        realizedPnl: stats.realizedPnl,
      }))
      .sort((left, right) => right.realizedPnl - left.realizedPnl);

    return {
      summary: {
        totalTrades,
        buyTrades,
        sellTrades,
        tradedSymbolCount: tradedSymbols.size,
        totalCommission: toPlainNumber(totalCommission),
        realizedPnl: toPlainNumber(realizedPnl),
        avgTradeAmount:
          totalTrades === 0
            ? null
            : toPlainNumber(totalTradeAmount.div(totalTrades)),
        winRate:
          sellTradesWithRealizedPnl === 0
            ? null
            : winningSellTrades / sellTradesWithRealizedPnl,
      },
      monthlyTradeCounts,
      monthlyTradeAmounts,
      symbolStats,
      realizedPnlContributions,
      warnings: buildWarnings(transactions, sourceWarnings),
      updatedAt: new Date().toISOString(),
    };
  }
}
