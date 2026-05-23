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
const DEFAULT_USER_ID = 'default_user';

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
  private async findDashboardEvents(userId: string) {
    const [events, importFiles] = await Promise.all([
      this.prisma.transactionEvent.findMany({
        where: { userId },
        orderBy: EVENT_ORDER,
      }),
      this.prisma.importFile.findMany({
        where: { userId },
        orderBy: [{ periodEnd: 'asc' }, { createdAt: 'asc' }],
      }),
    ]);
    const result = deduplicateDashboardEvents(events);
    return {
      ...result,
      importFiles,
    };
  }

  private async buildPortfolioContext(userId: string) {
    const { events, importFiles, warnings } = await this.findDashboardEvents(userId);
    const cashMetrics = calculateCashMetrics(events, importFiles);
    const positionCost = calculatePositionCost(events);
    const realizedPnlMetrics = calculateRealizedPnlSource(events, positionCost);
    const symbols = positionCost.positions
      .filter((position) => position.remainingQuantity.gt(0))
      .map((position) => position.symbol);
    const quotes = await this.quoteService.getCurrentQuotes(symbols, userId);
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

  async getSummary(userId = DEFAULT_USER_ID) {
    const {
      warnings,
      cashMetrics,
      positionCost,
      marketValuation,
      realizedPnlMetrics,
    } =
      await this.buildPortfolioContext(userId);
    return calculateDashboardSummary(
      cashMetrics,
      positionCost,
      marketValuation,
      realizedPnlMetrics,
      warnings,
    );
  }

  async getAssetTrend(userId = DEFAULT_USER_ID, range?: AssetTrendRange) {
    return this.monthlyTrendService.getMonthlyTrend(userId, range);
  }

  async getAllocation(userId = DEFAULT_USER_ID) {
    const { cashMetrics, marketValuation } = await this.buildPortfolioContext(userId);
    return calculateAllocation(cashMetrics, marketValuation);
  }

  async getReturnBreakdown(userId = DEFAULT_USER_ID) {
    const { cashMetrics, positionCost, marketValuation, realizedPnlMetrics } =
      await this.buildPortfolioContext(userId);
    return calculateReturnBreakdown(
      cashMetrics,
      positionCost,
      marketValuation,
      realizedPnlMetrics,
    );
  }

  async getRealizedPnlBySymbol(userId = DEFAULT_USER_ID) {
    const { events } = await this.findDashboardEvents(userId);
    const positionCost = calculatePositionCost(events);
    const realizedPnlMetrics = calculateRealizedPnlSource(events, positionCost);
    return calculateRealizedPnlBySymbol(positionCost, realizedPnlMetrics);
  }

  async getRecentTrades(userId = DEFAULT_USER_ID) {
    const trades = await this.prisma.transactionEvent.findMany({
      where: {
        userId,
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
