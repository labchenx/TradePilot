import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import Decimal from 'decimal.js';
import {
  MarketValuationItem,
  PositionCostItem,
} from '../dashboard/calculators/dashboard-calculator.types';
import { toPlainNumber } from '../dashboard/calculators/dashboard-decimal.util';
import { deduplicateDashboardEvents } from '../dashboard/calculators/deduplicate-events.util';
import { calculateMarketValuation } from '../dashboard/calculators/market-valuation.calculator';
import { calculatePositionCost } from '../dashboard/calculators/position-calculator';
import { QuoteService } from '../market-data/quote-service';
import { PrismaService } from '../prisma/prisma.service';

const EVENT_ORDER: Prisma.TransactionEventOrderByWithRelationInput[] = [
  { tradeDate: 'asc' },
  { rawRowIndex: 'asc' },
];
const DEFAULT_USER_ID = 'default_user';

export interface PortfolioHoldingItem {
  symbol: string;
  name?: string;
  quantity: number;
  avgCost: number | null;
  marketPrice: number | null;
  costBasis: number;
  marketValue: number | null;
  unrealizedPnl: number | null;
  unrealizedReturnRate: number | null;
  weight: number | null;
  currency: string;
  warnings: string[];
}

function toNullableNumber(value: Decimal | null) {
  return value === null ? null : toPlainNumber(value);
}

function divideOrNull(numerator: Decimal | null, denominator: Decimal) {
  if (numerator === null || denominator.eq(0)) {
    return null;
  }

  return numerator.div(denominator);
}

export interface PortfolioPositionsResponse {
  summary: {
    numberOfHoldings: number;
    totalMarketValue: number | null;
    totalCost: number;
    unrealizedPnl: number | null;
    unrealizedReturnRate: number | null;
    warnings: string[];
  };
  holdings: PortfolioHoldingItem[];
  allocation: Array<{
    symbol: string;
    marketValue: number;
    weight: number;
  }>;
  pnlBySymbol: Array<{
    symbol: string;
    unrealizedPnl: number;
  }>;
  updatedAt: string;
  warnings: string[];
}

function buildHoldingItem(
  position: PositionCostItem,
  valuation: MarketValuationItem | undefined,
  totalMarketValue: Decimal | null,
): PortfolioHoldingItem {
  const marketValue = valuation?.marketValue ?? null;
  const unrealizedPnl =
    marketValue === null ? null : marketValue.minus(position.remainingCost);
  const unrealizedReturnRate = divideOrNull(
    unrealizedPnl,
    position.remainingCost,
  );
  const weight = divideOrNull(marketValue, totalMarketValue ?? new Decimal(0));
  const warnings =
    valuation?.missingQuote === true
      ? [`Missing quote for ${position.symbol}. Market value and P/L are unavailable.`]
      : [];

  return {
    symbol: position.symbol,
    name: valuation?.name ?? position.symbol,
    quantity: toPlainNumber(position.remainingQuantity),
    avgCost: position.remainingQuantity.gt(0)
      ? toPlainNumber(position.remainingCost.div(position.remainingQuantity))
      : null,
    marketPrice: valuation?.price ? toPlainNumber(valuation.price) : null,
    costBasis: toPlainNumber(position.remainingCost),
    marketValue: toNullableNumber(marketValue),
    unrealizedPnl: toNullableNumber(unrealizedPnl),
    unrealizedReturnRate: toNullableNumber(unrealizedReturnRate),
    weight: toNullableNumber(weight),
    currency: valuation?.currency ?? 'USD',
    warnings,
  };
}

@Injectable()
export class PortfolioPositionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly quoteService: QuoteService,
  ) {}

  /**
   * Build the current holdings view from imported transaction events.
   *
   * Controller only exposes the API; this service owns the orchestration:
   * database rows -> de-duplicated events -> adjusted lots -> quote valuation.
   */
  async getPositions(userId = DEFAULT_USER_ID): Promise<PortfolioPositionsResponse> {
    const rawEvents = await this.prisma.transactionEvent.findMany({
      where: { userId },
      orderBy: EVENT_ORDER,
    });
    const { events, warnings: dedupeWarnings } =
      deduplicateDashboardEvents(rawEvents);
    const positionCost = calculatePositionCost(events);
    const currentPositions = positionCost.positions.filter((position) =>
      position.remainingQuantity.gt(0),
    );
    const symbols = currentPositions.map((position) => position.symbol);
    const quotes = await this.quoteService.getCurrentQuotes(symbols, userId);
    const marketValuation = calculateMarketValuation(positionCost, quotes);
    const valuationsBySymbol = new Map(
      marketValuation.items.map((item) => [item.symbol, item]),
    );
    const totalMarketValue = marketValuation.stockMarketValue;
    const totalCost = currentPositions.reduce(
      (sum, position) => sum.plus(position.remainingCost),
      new Decimal(0),
    );
    const unrealizedPnl =
      totalMarketValue === null ? null : totalMarketValue.minus(totalCost);
    const unrealizedReturnRate = divideOrNull(unrealizedPnl, totalCost);
    const holdings = currentPositions
      .map((position) =>
        buildHoldingItem(
          position,
          valuationsBySymbol.get(position.symbol),
          totalMarketValue,
        ),
      )
      .sort((a, b) => (b.marketValue ?? -1) - (a.marketValue ?? -1));
    const allocation =
      totalMarketValue === null || totalMarketValue.eq(0)
        ? []
        : holdings
            .filter((holding) => holding.marketValue !== null)
            .map((holding) => ({
              symbol: holding.symbol,
              marketValue: holding.marketValue as number,
              weight: holding.weight as number,
            }));
    const pnlBySymbol = holdings
      .filter((holding) => holding.unrealizedPnl !== null)
      .map((holding) => ({
        symbol: holding.symbol,
        unrealizedPnl: holding.unrealizedPnl as number,
      }))
      .sort((a, b) => b.unrealizedPnl - a.unrealizedPnl);
    const warnings = Array.from(
      new Set([
        ...dedupeWarnings,
        ...positionCost.warnings,
        ...marketValuation.warnings,
        ...holdings.flatMap((holding) => holding.warnings),
      ]),
    );

    return {
      summary: {
        numberOfHoldings: holdings.length,
        totalMarketValue: toNullableNumber(totalMarketValue),
        totalCost: toPlainNumber(totalCost),
        unrealizedPnl: toNullableNumber(unrealizedPnl),
        unrealizedReturnRate: toNullableNumber(unrealizedReturnRate),
        warnings,
      },
      holdings,
      allocation,
      pnlBySymbol,
      updatedAt: new Date().toISOString(),
      warnings,
    };
  }
}
