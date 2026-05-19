import { Injectable } from '@nestjs/common';
import { Prisma, TradeSide } from '@prisma/client';
import Decimal from 'decimal.js';
import { DashboardEventRow } from '../dashboard/calculators/dashboard-calculator.types';
import { toDecimal, toPlainNumber } from '../dashboard/calculators/dashboard-decimal.util';
import { deduplicateDashboardEvents } from '../dashboard/calculators/deduplicate-events.util';
import { findIbkrRealizedPnl } from '../dashboard/calculators/realized-pnl-source.calculator';
import { PrismaService } from '../prisma/prisma.service';
import {
  ListPortfolioTransactionsDto,
  PortfolioTransactionSortBy,
} from './dto/list-portfolio-transactions.dto';

type TransactionEventRow = Prisma.TransactionEventGetPayload<object>;

export interface PortfolioTransactionSummary {
  totalTrades: number;
  buyAmount: number;
  sellAmount: number;
  commission: number;
  realizedPnl: number;
  tradedSymbolCount: number;
}

export interface PortfolioTransactionItem {
  id: string;
  date: string;
  symbol: string;
  name?: string;
  side: 'BUY' | 'SELL';
  quantity: number | null;
  price: number | null;
  amount: number;
  commission: number;
  realizedPnl: number | null;
  currency: string;
  source: string;
  importBatchId: string;
  sourceFileName: string;
  sourceSection: string;
  rawRowIndex: number;
  accountId: string;
  description: string;
  ibkrType: string;
  eventType: string;
  rawRecord: unknown;
}

export interface PortfolioTransactionsResponse {
  summary: PortfolioTransactionSummary;
  transactions: PortfolioTransactionItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  warnings: string[];
}

const DEFAULT_CURRENCY = 'USD';

function toNullablePlainNumber(
  value: Prisma.Decimal | Decimal | null | undefined,
) {
  if (value === null || value === undefined) {
    return null;
  }

  return toPlainNumber(new Decimal(value.toString()));
}

function dateOnly(value: Date) {
  return value.toISOString().slice(0, 10);
}

function getTransactionName(row: TransactionEventRow) {
  if (!row.description || row.description === row.symbol) {
    return undefined;
  }

  return row.description;
}

function mapTransaction(row: TransactionEventRow): PortfolioTransactionItem {
  const realizedPnl =
    row.side === 'SELL' ? findIbkrRealizedPnl(row.rawData) : null;

  return {
    id: row.id,
    date: dateOnly(row.tradeDate),
    symbol: row.symbol as string,
    name: getTransactionName(row),
    side: row.side as 'BUY' | 'SELL',
    quantity: toNullablePlainNumber(row.absQuantity ?? row.quantity),
    price: toNullablePlainNumber(row.price),
    amount: toPlainNumber(toDecimal(row.netAmount)),
    commission: toPlainNumber(toDecimal(row.commission)),
    realizedPnl: realizedPnl === null ? null : toPlainNumber(realizedPnl),
    currency: row.currency ?? DEFAULT_CURRENCY,
    source: row.source,
    importBatchId: row.importFileId,
    sourceFileName: row.sourceFileName,
    sourceSection: row.sourceSection,
    rawRowIndex: row.rawRowIndex,
    accountId: row.accountId,
    description: row.description,
    ibkrType: row.ibkrType,
    eventType: row.eventType,
    rawRecord: row.rawData,
  };
}

function compareNullableNumber(
  left: number | null,
  right: number | null,
  direction: 1 | -1,
) {
  if (left === null && right === null) return 0;
  if (left === null) return 1;
  if (right === null) return -1;
  return (left - right) * direction;
}

function sortTransactions(
  transactions: PortfolioTransactionItem[],
  sortBy: PortfolioTransactionSortBy,
  sortDirection: 'asc' | 'desc',
) {
  const direction = sortDirection === 'asc' ? 1 : -1;

  return [...transactions].sort((left, right) => {
    if (sortBy === 'symbol') {
      return left.symbol.localeCompare(right.symbol) * direction;
    }

    if (sortBy === 'amount') {
      return (left.amount - right.amount) * direction;
    }

    if (sortBy === 'realizedPnl') {
      return compareNullableNumber(
        left.realizedPnl,
        right.realizedPnl,
        direction,
      );
    }

    return left.date.localeCompare(right.date) * direction;
  });
}

function buildSummary(
  transactions: PortfolioTransactionItem[],
): PortfolioTransactionSummary {
  const summary = transactions.reduce(
    (acc, transaction) => {
      const amount = new Decimal(transaction.amount).abs();
      const commission = new Decimal(transaction.commission).abs();

      if (transaction.side === 'BUY') {
        acc.buyAmount = acc.buyAmount.plus(amount);
      } else {
        acc.sellAmount = acc.sellAmount.plus(amount);
      }

      acc.commission = acc.commission.plus(commission);

      if (transaction.realizedPnl !== null) {
        acc.realizedPnl = acc.realizedPnl.plus(transaction.realizedPnl);
      }

      acc.symbols.add(transaction.symbol);
      return acc;
    },
    {
      buyAmount: new Decimal(0),
      sellAmount: new Decimal(0),
      commission: new Decimal(0),
      realizedPnl: new Decimal(0),
      symbols: new Set<string>(),
    },
  );

  return {
    totalTrades: transactions.length,
    buyAmount: toPlainNumber(summary.buyAmount),
    sellAmount: toPlainNumber(summary.sellAmount),
    commission: toPlainNumber(summary.commission),
    realizedPnl: toPlainNumber(summary.realizedPnl),
    tradedSymbolCount: summary.symbols.size,
  };
}

function buildWarnings(
  transactions: PortfolioTransactionItem[],
  dedupeWarnings: string[],
) {
  const warnings = new Set(dedupeWarnings);
  const missingQuantityCount = transactions.filter(
    (transaction) => transaction.quantity === null,
  ).length;
  const missingPriceCount = transactions.filter(
    (transaction) => transaction.price === null,
  ).length;
  const missingCurrencyCount = transactions.filter(
    (transaction) => !transaction.currency,
  ).length;
  const sellMissingRealizedPnlCount = transactions.filter(
    (transaction) =>
      transaction.side === 'SELL' && transaction.realizedPnl === null,
  ).length;

  if (missingQuantityCount > 0) {
    warnings.add(
      `${missingQuantityCount} trade rows are missing quantity. Please review rawRecord.`,
    );
  }

  if (missingPriceCount > 0) {
    warnings.add(
      `${missingPriceCount} trade rows are missing price. Please review rawRecord.`,
    );
  }

  if (missingCurrencyCount > 0) {
    warnings.add(
      `${missingCurrencyCount} trade rows are missing currency. USD is used only as a display fallback.`,
    );
  }

  if (sellMissingRealizedPnlCount > 0) {
    warnings.add(
      `${sellMissingRealizedPnlCount} SELL trade rows do not include IBKR realizedPnl in rawRecord. The page leaves realizedPnl empty and does not overwrite it with FIFO.`,
    );
  }

  return Array.from(warnings);
}

function isStockTradeEvent(
  event: DashboardEventRow,
): event is DashboardEventRow & { symbol: string; side: 'BUY' | 'SELL' } {
  return (
    event.isTrade &&
    typeof event.symbol === 'string' &&
    event.symbol.length > 0 &&
    (event.side === 'BUY' || event.side === 'SELL')
  );
}

@Injectable()
export class PortfolioTransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Transactions page is a debugging surface, so it starts from persisted
   * normalized transaction_events and keeps all financial aggregation here.
   */
  async getTransactions(
    query: ListPortfolioTransactionsDto,
  ): Promise<PortfolioTransactionsResponse> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 50;
    const sortBy = query.sortBy ?? 'date';
    const sortDirection = query.sortDirection ?? 'desc';
    const keyword = query.search?.trim();
    const where: Prisma.TransactionEventWhereInput = {
      isTrade: true,
      side: query.side
        ? query.side
        : {
            in: [TradeSide.BUY, TradeSide.SELL],
          },
      symbol: { not: null },
      ...(keyword
        ? {
            OR: [
              { symbol: { contains: keyword, mode: 'insensitive' } },
              { description: { contains: keyword, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const rows = await this.prisma.transactionEvent.findMany({
      where,
      orderBy: [{ tradeDate: 'desc' }, { rawRowIndex: 'desc' }],
    });
    const { events, warnings: dedupeWarnings } = deduplicateDashboardEvents(
      rows as DashboardEventRow[],
    );
    const allTransactions = sortTransactions(
      events
        .filter(isStockTradeEvent)
        .map((event) => mapTransaction(event as TransactionEventRow)),
      sortBy,
      sortDirection,
    );
    const total = allTransactions.length;
    const start = (page - 1) * pageSize;
    const transactions = allTransactions.slice(start, start + pageSize);

    return {
      summary: buildSummary(allTransactions),
      transactions,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
      warnings: buildWarnings(allTransactions, dedupeWarnings),
    };
  }
}
