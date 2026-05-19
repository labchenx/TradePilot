import { Injectable } from '@nestjs/common';
import { IbkrEventType, Prisma } from '@prisma/client';
import { QuoteService } from '../market-data/quote-service';
import { MonthlyTrendService } from '../portfolio/monthly-trend.service';
import { PrismaService } from '../prisma/prisma.service';
import { calculateAllocation } from './calculators/allocation.calculator';
import { calculateCashMetrics } from './calculators/cash-calculator';
import { calculateDashboardSummary } from './calculators/dashboard-summary.calculator';
import { deduplicateDashboardEvents } from './calculators/deduplicate-events.util';
import { calculateMarketValuation } from './calculators/market-valuation.calculator';
import { calculatePositionCost } from './calculators/position-calculator';
import { calculateRealizedPnlBySymbol } from './calculators/realized-pnl.calculator';
import { calculateRealizedPnlSource } from './calculators/realized-pnl-source.calculator';
import { calculateRecentTrades } from './calculators/recent-trades.calculator';
import { calculateReturnBreakdown } from './calculators/return-breakdown.calculator';
import { AssetTrendRange } from './dto/asset-trend.dto';

const EVENT_ORDER: Prisma.TransactionEventOrderByWithRelationInput[] = [
  { tradeDate: 'asc' },
  { rawRowIndex: 'asc' },
];

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly quoteService: QuoteService,
    private readonly monthlyTrendService: MonthlyTrendService,
  ) {}

  /**
   * Dashboard 的大部分模块都基于同一份 transaction_events。
   * Service 只负责取数、去重和编排，具体金融计算交给 calculators。
   */
  private async findDashboardEvents() {
    const [events, importFiles] = await Promise.all([
      this.prisma.transactionEvent.findMany({
        orderBy: EVENT_ORDER,
      }),
      this.prisma.importFile.findMany({
        orderBy: [{ periodEnd: 'asc' }, { createdAt: 'asc' }],
      }),
    ]);
    const result = deduplicateDashboardEvents(events);
    return {
      ...result,
      importFiles,
    };
  }

  private async buildPortfolioContext() {
    const { events, importFiles, warnings } = await this.findDashboardEvents();
    const cashMetrics = calculateCashMetrics(events, importFiles);
    const positionCost = calculatePositionCost(events);
    const realizedPnlMetrics = calculateRealizedPnlSource(events, positionCost);
    const symbols = positionCost.positions
      .filter((position) => position.remainingQuantity.gt(0))
      .map((position) => position.symbol);
    const quotes = await this.quoteService.getCurrentQuotes(symbols);
    const marketValuation = calculateMarketValuation(positionCost, quotes);

    return {
      events,
      warnings,
      cashMetrics,
      positionCost,
      realizedPnlMetrics,
      marketValuation,
    };
  }

  async getSummary() {
    const {
      warnings,
      cashMetrics,
      positionCost,
      marketValuation,
      realizedPnlMetrics,
    } =
      await this.buildPortfolioContext();
    return calculateDashboardSummary(
      cashMetrics,
      positionCost,
      marketValuation,
      realizedPnlMetrics,
      warnings,
    );
  }

  async getAssetTrend(range?: AssetTrendRange) {
    return this.monthlyTrendService.getMonthlyTrend(range);
  }

  async getAllocation() {
    const { cashMetrics, marketValuation } = await this.buildPortfolioContext();
    return calculateAllocation(cashMetrics, marketValuation);
  }

  async getReturnBreakdown() {
    const { cashMetrics, positionCost, marketValuation, realizedPnlMetrics } =
      await this.buildPortfolioContext();
    return calculateReturnBreakdown(
      cashMetrics,
      positionCost,
      marketValuation,
      realizedPnlMetrics,
    );
  }

  async getRealizedPnlBySymbol() {
    const { events } = await this.findDashboardEvents();
    const positionCost = calculatePositionCost(events);
    const realizedPnlMetrics = calculateRealizedPnlSource(events, positionCost);
    return calculateRealizedPnlBySymbol(positionCost, realizedPnlMetrics);
  }

  async getRecentTrades() {
    const trades = await this.prisma.transactionEvent.findMany({
      where: {
        eventType: {
          in: [IbkrEventType.TRADE_BUY, IbkrEventType.TRADE_SELL],
        },
      },
      orderBy: [{ tradeDate: 'desc' }, { rawRowIndex: 'desc' }],
      take: 100,
    });

    return calculateRecentTrades(deduplicateDashboardEvents(trades).events).slice(
      0,
      5,
    );
  }
}
