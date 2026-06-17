import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, TradeSide } from '@prisma/client';
import Decimal from 'decimal.js';
import { DashboardEventRow } from '../dashboard/calculators/dashboard-calculator.types';
import { toDecimal, toPlainNumber } from '../dashboard/calculators/dashboard-decimal.util';
import { deduplicateDashboardEvents } from '../dashboard/calculators/deduplicate-events.util';
import { findIbkrRealizedPnl } from '../dashboard/calculators/realized-pnl-source.calculator';
import { createEmailPdfTradeSourceHash } from '../email-sync/ibkr-pdf-trade-parser';
import { PrismaService } from '../prisma/prisma.service';
import {
  ListPortfolioTransactionsDto,
  PortfolioTransactionSortBy,
  PortfolioTransactionSide,
} from './dto/list-portfolio-transactions.dto';
import { UpdateTransactionSide } from './dto/update-transaction-side.dto';

type TransactionEventRow = Prisma.TransactionEventGetPayload<object>;
type JsonObject = Record<string, unknown>;

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

export interface PortfolioTransactionItemFilters {
  userId?: string;
  search?: string;
  side?: PortfolioTransactionSide;
  symbol?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface PortfolioTransactionItemResult {
  transactions: PortfolioTransactionItem[];
  warnings: string[];
}

const DEFAULT_CURRENCY = 'USD';
const DEFAULT_USER_ID = 'default_user';

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

function isJsonObject(value: unknown): value is JsonObject {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function parseRawNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return undefined;

  const parsed = Number(value.replace(/[(),]/g, ''));
  if (!Number.isFinite(parsed)) return undefined;
  return /^\(.*\)$/.test(value) ? -parsed : parsed;
}

function getRawString(rawData: JsonObject, key: string) {
  const value = rawData[key];
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function buildCorrectedRawData(
  rawData: Prisma.JsonValue,
  side: UpdateTransactionSide,
  sourceHash?: string | null,
) {
  if (!isJsonObject(rawData)) {
    return { side, sourceHash };
  }

  return {
    ...rawData,
    side,
    ibkrType: side,
    sourceHash: sourceHash ?? rawData.sourceHash,
  };
}

function buildCorrectedDescription(
  row: TransactionEventRow,
  side: UpdateTransactionSide,
) {
  if (row.source === 'IBKR_EMAIL_PDF' && row.symbol) {
    return `IBKR Email PDF ${side} ${row.symbol}`;
  }

  return row.description;
}

function buildCorrectedEmailPdfSourceHash(input: {
  row: TransactionEventRow;
  rawData: JsonObject;
  side: UpdateTransactionSide;
  quantityAbs: Decimal;
  price: Decimal | null;
  grossAmount: Decimal;
}) {
  const { row, rawData, side, quantityAbs, price, grossAmount } = input;
  if (row.source !== 'IBKR_EMAIL_PDF' || !row.symbol || !price) {
    return row.sourceEventHash;
  }

  const tradeDate = dateOnly(row.tradeDate);
  const tradeDateTime = getRawString(rawData, 'tradeDateTime') ?? `${tradeDate} 00:00:00`;
  const commission =
    parseRawNumber(rawData.commission) ?? toPlainNumber(toDecimal(row.commission));
  const fee = parseRawNumber(rawData.fee) ?? 0;

  return createEmailPdfTradeSourceHash({
    accountId: row.accountId || undefined,
    symbol: row.symbol,
    tradeDateTime,
    tradeDate,
    settleDate: getRawString(rawData, 'settleDate'),
    exchange: getRawString(rawData, 'exchange'),
    side,
    quantity: toPlainNumber(quantityAbs),
    price: toPlainNumber(price),
    proceeds: toPlainNumber(grossAmount),
    commission,
    fee,
    currency: row.currency ?? DEFAULT_CURRENCY,
    orderType: getRawString(rawData, 'orderType'),
    code: getRawString(rawData, 'code'),
  });
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
    !event.isExternalCashFlow &&
    (event.eventType === 'TRADE_BUY' || event.eventType === 'TRADE_SELL') &&
    typeof event.symbol === 'string' &&
    event.symbol.length > 0 &&
    (event.side === 'BUY' || event.side === 'SELL')
  );
}

@Injectable()
export class PortfolioTransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async listTransactionItems(
    filters: PortfolioTransactionItemFilters = {},
  ): Promise<PortfolioTransactionItemResult> {
    const keyword = filters.search?.trim();
    const symbol = filters.symbol?.trim();
    const where: Prisma.TransactionEventWhereInput = {
      userId: filters.userId ?? DEFAULT_USER_ID,
      isTrade: true,
      isExternalCashFlow: false,
      side: filters.side
        ? filters.side
        : {
            in: [TradeSide.BUY, TradeSide.SELL],
          },
      symbol: symbol
        ? { equals: symbol, mode: 'insensitive' }
        : { not: null },
      ...(filters.startDate || filters.endDate
        ? {
            tradeDate: {
              ...(filters.startDate ? { gte: filters.startDate } : {}),
              ...(filters.endDate ? { lte: filters.endDate } : {}),
            },
          }
        : {}),
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
    const { events, warnings } = deduplicateDashboardEvents(
      rows as DashboardEventRow[],
    );

    return {
      transactions: events
        .filter(isStockTradeEvent)
        .map((event) => mapTransaction(event as TransactionEventRow)),
      warnings,
    };
  }

  /**
   * Transactions page is a debugging surface, so it starts from persisted
   * normalized transaction_events and keeps all financial aggregation here.
   */
  async getTransactions(
    userIdOrQuery: string | ListPortfolioTransactionsDto,
    maybeQuery?: ListPortfolioTransactionsDto,
  ): Promise<PortfolioTransactionsResponse> {
    const userId =
      typeof userIdOrQuery === 'string' ? userIdOrQuery : DEFAULT_USER_ID;
    const query = typeof userIdOrQuery === 'string' ? (maybeQuery ?? {}) : userIdOrQuery;
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 50;
    const sortBy = query.sortBy ?? 'date';
    const sortDirection = query.sortDirection ?? 'desc';
    const { transactions: transactionItems, warnings: dedupeWarnings } =
      await this.listTransactionItems({
        userId,
        search: query.search,
        side: query.side,
      });
    const allTransactions = sortTransactions(
      transactionItems,
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

  /**
   * Export all transactions matching the current filters as CSV text.
   * No pagination — returns every row so the frontend can download the full set.
   */
  async exportTransactions(
    userIdOrQuery: string | ListPortfolioTransactionsDto,
    maybeQuery?: ListPortfolioTransactionsDto,
  ): Promise<string> {
    const userId =
      typeof userIdOrQuery === 'string' ? userIdOrQuery : DEFAULT_USER_ID;
    const query =
      typeof userIdOrQuery === 'string' ? (maybeQuery ?? {}) : userIdOrQuery;
    const sortBy = query.sortBy ?? 'date';
    const sortDirection = query.sortDirection ?? 'desc';

    const { transactions: transactionItems } = await this.listTransactionItems({
      userId,
      search: query.search,
      side: query.side,
    });

    const sorted = sortTransactions(transactionItems, sortBy, sortDirection);

    const headers = [
      'date',
      'symbol',
      'name',
      'side',
      'quantity',
      'price',
      'amount',
      'commission',
      'realizedPnl',
      'currency',
      'source',
      'accountId',
      'eventType',
      'description',
    ];

    const csvRows = sorted.map((t) =>
      [
        t.date,
        t.symbol,
        t.name ?? '',
        t.side,
        t.quantity ?? '',
        t.price ?? '',
        t.amount,
        t.commission,
        t.realizedPnl ?? '',
        t.currency,
        t.source,
        t.accountId,
        t.eventType,
        (t.description ?? '').replace(/"/g, '""'),
      ]
        .map((value) => (typeof value === 'string' && value.includes(',') ? `"${value}"` : value))
        .join(','),
    );

    return [headers.join(','), ...csvRows].join('\n');
  }

  async updateTransactionSide(
    userId: string,
    id: string,
    side: UpdateTransactionSide,
  ): Promise<PortfolioTransactionItem> {
    const row = await this.prisma.transactionEvent.findUnique({
      where: { id },
    });

    if (!row || row.userId !== userId) {
      throw new NotFoundException('Transaction record was not found.');
    }

    if (!row.isTrade || row.isExternalCashFlow || !row.symbol) {
      throw new BadRequestException('Only stock BUY/SELL trade rows can be corrected.');
    }

    if (row.side !== 'BUY' && row.side !== 'SELL') {
      throw new BadRequestException('This transaction does not have a BUY/SELL side.');
    }

    const quantityAbs = toDecimal(row.absQuantity ?? row.quantity ?? new Prisma.Decimal(0)).abs();
    const price = row.price ? toDecimal(row.price) : null;
    const grossAbs = toDecimal(row.grossAmount).abs();
    const correctedQuantity = side === 'SELL' ? quantityAbs.negated() : quantityAbs;
    const correctedGrossAmount = side === 'BUY' ? grossAbs.negated() : grossAbs;
    const correctedNetAmount = correctedGrossAmount.plus(toDecimal(row.commission));
    const rawData = isJsonObject(row.rawData) ? row.rawData : {};
    const correctedSourceHash = buildCorrectedEmailPdfSourceHash({
      row,
      rawData,
      side,
      quantityAbs,
      price,
      grossAmount: correctedGrossAmount,
    });

    if (correctedSourceHash && correctedSourceHash !== row.sourceEventHash) {
      const duplicate = await this.prisma.transactionEvent.findFirst({
        where: {
          userId,
          sourceEventHash: correctedSourceHash,
          id: { not: id },
        },
        select: { id: true },
      });

      if (duplicate) {
        throw new BadRequestException(
          'A transaction with the corrected source hash already exists.',
        );
      }
    }

    const correctedRawData = buildCorrectedRawData(
      row.rawData,
      side,
      correctedSourceHash,
    );

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.transactionEvent.update({
        where: { id },
        data: {
          sourceEventHash: correctedSourceHash,
          description: buildCorrectedDescription(row, side),
          ibkrType: side,
          eventType: side === 'BUY' ? 'TRADE_BUY' : 'TRADE_SELL',
          quantity: new Prisma.Decimal(correctedQuantity.toString()),
          absQuantity: new Prisma.Decimal(quantityAbs.toString()),
          grossAmount: new Prisma.Decimal(correctedGrossAmount.toString()),
          netAmount: new Prisma.Decimal(correctedNetAmount.toString()),
          side,
          rawData: correctedRawData as Prisma.InputJsonValue,
        },
      });

      if (row.sourceEventHash) {
        await tx.importRecord.updateMany({
          where: {
            userId,
            sourceHash: row.sourceEventHash,
          },
          data: {
            sourceHash: correctedSourceHash,
          },
        });
      }

      return mapTransaction(updated);
    });
  }
}
