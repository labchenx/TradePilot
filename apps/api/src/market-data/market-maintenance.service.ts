import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { calculatePositionCost } from '../dashboard/calculators/position-calculator';
import { deduplicateDashboardEvents } from '../dashboard/calculators/deduplicate-events.util';
import { PrismaService } from '../prisma/prisma.service';
import { HistoricalPriceService } from './historical-price.service';
import { QuoteService } from './quote-service';

const EVENT_ORDER: Prisma.TransactionEventOrderByWithRelationInput[] = [
  { tradeDate: 'asc' },
  { rawRowIndex: 'asc' },
];

function monthKey(value: Date) {
  return value.toISOString().slice(0, 7);
}

function monthStart(month: string) {
  const [year, monthNumber] = month.split('-').map(Number);
  return new Date(Date.UTC(year, monthNumber - 1, 1));
}

function monthEnd(month: string) {
  const [year, monthNumber] = month.split('-').map(Number);
  return new Date(Date.UTC(year, monthNumber, 0));
}

function nextMonth(month: string) {
  const [year, monthNumber] = month.split('-').map(Number);
  return monthKey(new Date(Date.UTC(year, monthNumber, 1)));
}

function buildMonthRange(startMonth: string, endMonth: string) {
  const months: string[] = [];
  let current = startMonth;

  while (current <= endMonth && months.length < 180) {
    months.push(current);
    current = nextMonth(current);
  }

  return months;
}

@Injectable()
export class MarketMaintenanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly quoteService: QuoteService,
    private readonly historicalPriceService: HistoricalPriceService,
  ) {}

  async refreshQuotes(userId: string) {
    const symbols = await this.findCurrentPositionSymbols(userId);
    const result = await this.quoteService.getCurrentQuotes(symbols, userId);
    const refreshedSymbols = Array.from(result.quotesBySymbol.keys());

    return {
      success: true,
      requestedSymbols: symbols,
      refreshedSymbols,
      refreshedCount: refreshedSymbols.length,
      missingSymbols: symbols.filter((symbol) => !result.quotesBySymbol.has(symbol)),
      warnings: result.warnings,
      runAt: new Date().toISOString(),
    };
  }

  async backfillHistory(userId: string) {
    const [symbols, months] = await Promise.all([
      this.findUserSymbols(userId),
      this.findMonthsForBackfill(userId),
    ]);
    const warnings = new Set<string>();
    let cachedPrices = 0;
    let missingPrices = 0;

    for (const symbol of symbols) {
      for (const month of months) {
        const price = await this.historicalPriceService.getMonthEndClosePrice(
          symbol,
          monthStart(month),
          monthEnd(month),
          userId,
        );
        price.warnings.forEach((warning) => warnings.add(warning));
        if (price.close) {
          cachedPrices += 1;
        } else {
          missingPrices += 1;
        }
      }
    }

    return {
      success: true,
      symbols,
      months,
      cachedPrices,
      missingPrices,
      warnings: Array.from(warnings),
      runAt: new Date().toISOString(),
    };
  }

  private async findCurrentPositionSymbols(userId: string) {
    const events = await this.findEvents(userId);
    const positionCost = calculatePositionCost(events);

    return positionCost.positions
      .filter((position) => position.remainingQuantity.gt(0))
      .map((position) => position.symbol);
  }

  private async findUserSymbols(userId: string) {
    const rows = await this.prisma.transactionEvent.findMany({
      where: { userId, symbol: { not: null } },
      distinct: ['symbol'],
      select: { symbol: true },
      orderBy: { symbol: 'asc' },
    });

    return rows
      .map((row) => row.symbol)
      .filter((symbol): symbol is string => Boolean(symbol));
  }

  private async findMonthsForBackfill(userId: string) {
    const snapshots = await this.prisma.portfolioMonthlySnapshot.findMany({
      where: { userId },
      distinct: ['month'],
      select: { month: true },
      orderBy: { month: 'asc' },
    });

    if (snapshots.length > 0) {
      return snapshots.map((snapshot) => snapshot.month);
    }

    const events = await this.prisma.transactionEvent.findMany({
      where: { userId },
      select: { tradeDate: true },
      orderBy: { tradeDate: 'asc' },
    });

    if (events.length === 0) return [];

    return buildMonthRange(
      monthKey(events[0].tradeDate),
      monthKey(new Date()),
    );
  }

  private async findEvents(userId: string) {
    const rows = await this.prisma.transactionEvent.findMany({
      where: { userId },
      orderBy: EVENT_ORDER,
    });

    return deduplicateDashboardEvents(rows).events;
  }
}
