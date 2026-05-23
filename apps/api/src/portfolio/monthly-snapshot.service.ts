import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import Decimal from 'decimal.js';
import { calculatePositionCost } from '../dashboard/calculators/position-calculator';
import { deduplicateDashboardEvents } from '../dashboard/calculators/deduplicate-events.util';
import { convertToDashboardCurrency } from '../dashboard/calculators/exchange-rate.util';
import { calculateCashMetrics } from '../dashboard/calculators/cash-calculator';
import { HistoricalPriceService } from '../market-data/historical-price.service';
import { PrismaService } from '../prisma/prisma.service';

const DEFAULT_ACCOUNT_ID = 'ALL';
const DEFAULT_USER_ID = 'default_user';

const EVENT_ORDER: Prisma.TransactionEventOrderByWithRelationInput[] = [
  { tradeDate: 'asc' },
  { rawRowIndex: 'asc' },
];

function toDateOnly(value: Date) {
  return new Date(value.toISOString().slice(0, 10) + 'T00:00:00.000Z');
}

function getMonthKey(value: Date) {
  return value.toISOString().slice(0, 7);
}

function parseMonth(month: string) {
  const [year, monthNumber] = month.split('-').map(Number);
  return { year, monthNumber };
}

function monthStart(month: string) {
  const { year, monthNumber } = parseMonth(month);
  return new Date(Date.UTC(year, monthNumber - 1, 1));
}

function monthEnd(month: string) {
  const { year, monthNumber } = parseMonth(month);
  return new Date(Date.UTC(year, monthNumber, 0));
}

function nextMonth(month: string) {
  const { year, monthNumber } = parseMonth(month);
  return getMonthKey(new Date(Date.UTC(year, monthNumber, 1)));
}

function buildMonthRange(startMonth: string, endMonth: string) {
  const months: string[] = [];
  let current = startMonth;

  while (current <= endMonth) {
    months.push(current);
    current = nextMonth(current);
  }

  return months;
}

function minDate(a: Date, b: Date) {
  return a.getTime() <= b.getTime() ? a : b;
}

function getImportFileEffectiveDate(
  importFile: Prisma.ImportFileGetPayload<object>,
) {
  return importFile.periodEnd ?? importFile.createdAt;
}

function filterImportFilesUntilDate(
  importFiles: Prisma.ImportFileGetPayload<object>[],
  snapshotDate: Date,
) {
  return importFiles.filter(
    (importFile) =>
      getImportFileEffectiveDate(importFile).getTime() <= snapshotDate.getTime(),
  );
}

@Injectable()
export class MonthlySnapshotService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly historicalPriceService: HistoricalPriceService,
  ) {}

  private async findEvents(userId: string, accountId: string) {
    const events = await this.prisma.transactionEvent.findMany({
      where:
        accountId === DEFAULT_ACCOUNT_ID
          ? { userId }
          : { userId, accountId },
      orderBy: EVENT_ORDER,
    });

    return deduplicateDashboardEvents(events).events;
  }

  private async findImportFiles(userId: string) {
    return this.prisma.importFile.findMany({
      where: { userId },
      orderBy: [{ periodEnd: 'asc' }, { createdAt: 'asc' }],
    });
  }

  /**
   * 当前阶段先做全量快照生成。
   *
   * 这个方法的签名已经按后续增量重算设计：外部只需要给 accountId。
   * 等数据量变大时，可以把内部实现替换成“读取上月快照 + 只应用后续事件”，调用方不需要改。
   */
  async generateMonthlySnapshots(
    userId = DEFAULT_USER_ID,
    accountId = DEFAULT_ACCOUNT_ID,
  ) {
    const events = await this.findEvents(userId, accountId);

    if (events.length === 0) {
      await this.prisma.$transaction([
        this.prisma.positionMonthlySnapshot.deleteMany({ where: { userId, accountId } }),
        this.prisma.portfolioMonthlySnapshot.deleteMany({ where: { userId, accountId } }),
      ]);
      return { generatedMonths: 0, warnings: [] };
    }

    const firstMonth = getMonthKey(events[0].tradeDate);
    const lastMonth = getMonthKey(events[events.length - 1].tradeDate);

    return this.rebuildSnapshots(userId, accountId, firstMonth, firstMonth, lastMonth);
  }

  /**
   * 后续导入新交易后调用这个入口。
   *
   * 当前实现仍会从第一笔事件开始重算状态，保证结果正确；但只删除并重写 startMonth
   * 之后的快照。未来可以在这里接入“上一个月快照作为起点”的增量算法。
   */
  async regenerateSnapshotsFromMonth(
    userId = DEFAULT_USER_ID,
    accountId = DEFAULT_ACCOUNT_ID,
    startMonth = '1970-01',
  ) {
    const events = await this.findEvents(userId, accountId);

    if (events.length === 0) {
      return this.generateMonthlySnapshots(userId, accountId);
    }

    const firstMonth = getMonthKey(events[0].tradeDate);
    const lastMonth = getMonthKey(events[events.length - 1].tradeDate);
    const normalizedStartMonth = startMonth < firstMonth ? firstMonth : startMonth;

    return this.rebuildSnapshots(
      userId,
      accountId,
      normalizedStartMonth,
      firstMonth,
      lastMonth,
    );
  }

  private async rebuildSnapshots(
    userId: string,
    accountId: string,
    deleteFromMonth: string,
    calculationStartMonth: string,
    calculationEndMonth: string,
  ) {
    const [events, importFiles] = await Promise.all([
      this.findEvents(userId, accountId),
      this.findImportFiles(userId),
    ]);
    const today = toDateOnly(new Date());
    const months = buildMonthRange(calculationStartMonth, calculationEndMonth);
    const portfolioRows: Prisma.PortfolioMonthlySnapshotCreateManyInput[] = [];
    const positionRows: Prisma.PositionMonthlySnapshotCreateManyInput[] = [];
    const warnings = new Set<string>();

    for (const month of months) {
      const snapshotDate = minDate(monthEnd(month), today);
      const eventsUntilMonth = events.filter(
        (event) => event.tradeDate.getTime() <= snapshotDate.getTime(),
      );
      const importFilesUntilMonth = filterImportFilesUntilDate(
        importFiles,
        snapshotDate,
      );
      const cashMetrics = calculateCashMetrics(
        eventsUntilMonth,
        importFilesUntilMonth,
      );
      cashMetrics.warnings.forEach((warning) => warnings.add(warning));

      const positionCost = calculatePositionCost(eventsUntilMonth);
      positionCost.warnings.forEach((warning) => warnings.add(warning));

      let stockMarketValue = new Decimal(0);
      let hasMissingMarketValue = false;

      for (const position of positionCost.positions.filter((item) =>
        item.remainingQuantity.gt(0),
      )) {
        const price = await this.historicalPriceService.getMonthEndClosePrice(
          position.symbol,
          monthStart(month),
          snapshotDate,
          userId,
        );
        price.warnings.forEach((warning) => warnings.add(warning));

        if (!price.close || !price.currency) {
          hasMissingMarketValue = true;
          positionRows.push({
            userId,
            accountId,
            month,
            symbol: position.symbol,
            quantity: position.remainingQuantity,
            costBasis: position.remainingCost,
            marketPrice: null,
            marketValue: null,
            unrealizedPnl: null,
            currency: price.currency ?? 'UNKNOWN',
          });
          continue;
        }

        const localMarketValue = position.remainingQuantity.mul(price.close);
        const convertedMarketValue = convertToDashboardCurrency(
          localMarketValue,
          price.currency,
        );
        convertedMarketValue.warnings.forEach((warning) => warnings.add(warning));

        const marketValue = convertedMarketValue.amount;
        stockMarketValue = stockMarketValue.plus(marketValue);

        positionRows.push({
          userId,
          accountId,
          month,
          symbol: position.symbol,
          quantity: position.remainingQuantity,
          costBasis: position.remainingCost,
          marketPrice: price.close,
          marketValue,
          unrealizedPnl: marketValue.minus(position.remainingCost),
          currency: price.currency,
        });
      }

      const totalAssets = hasMissingMarketValue
        ? null
        : cashMetrics.cashBalance.plus(stockMarketValue);
      const totalReturn = totalAssets
        ? totalAssets.minus(cashMetrics.netDeposit)
        : null;

      if (month >= deleteFromMonth) {
        portfolioRows.push({
          userId,
          accountId,
          month,
          snapshotDate,
          cashBalance: cashMetrics.cashBalance,
          stockMarketValue: hasMissingMarketValue ? null : stockMarketValue,
          totalAssets,
          netDeposit: cashMetrics.netDeposit,
          totalReturn,
          realizedPnl: positionCost.totalRealizedPnl,
          realizedNetIncome: positionCost.totalRealizedPnl.plus(
            cashMetrics.realizedNetIncomeAdjustments,
          ),
        });
      }
    }

    const positionRowsToWrite = positionRows.filter(
      (row) => row.month >= deleteFromMonth,
    );

    await this.prisma.$transaction(async (tx) => {
      await tx.positionMonthlySnapshot.deleteMany({
        where: { userId, accountId, month: { gte: deleteFromMonth } },
      });
      await tx.portfolioMonthlySnapshot.deleteMany({
        where: { userId, accountId, month: { gte: deleteFromMonth } },
      });

      if (portfolioRows.length > 0) {
        await tx.portfolioMonthlySnapshot.createMany({
          data: portfolioRows,
          skipDuplicates: true,
        });
      }

      if (positionRowsToWrite.length > 0) {
        await tx.positionMonthlySnapshot.createMany({
          data: positionRowsToWrite,
          skipDuplicates: true,
        });
      }
    });

    return {
      generatedMonths: portfolioRows.length,
      warnings: Array.from(warnings),
    };
  }
}
