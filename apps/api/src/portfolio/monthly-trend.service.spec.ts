import { Prisma } from '@prisma/client';
import { MonthlyTrendService } from './monthly-trend.service';

function createPrismaMock() {
  return {
    portfolioMonthlySnapshot: {
      findMany: jest.fn(),
    },
    importFile: {
      findMany: jest.fn(),
    },
    positionMonthlySnapshot: {
      findMany: jest.fn(),
    },
    priceHistory: {
      findFirst: jest.fn(),
    },
  };
}

function createSnapshot(month: string, totalAssets: number | null) {
  return {
    month,
    snapshotDate: new Date(`${month}-28T00:00:00.000Z`),
    totalAssets: totalAssets === null ? null : new Prisma.Decimal(totalAssets),
    stockMarketValue:
      totalAssets === null ? null : new Prisma.Decimal(totalAssets - 100),
    cashBalance: new Prisma.Decimal(100),
    netDeposit: new Prisma.Decimal(1000),
    totalReturn: totalAssets === null ? null : new Prisma.Decimal(totalAssets - 1000),
  };
}

describe('MonthlyTrendService', () => {
  it('regenerates stale snapshots when missing market prices already exist in price history', async () => {
    const prisma = createPrismaMock();
    prisma.portfolioMonthlySnapshot.findMany
      .mockResolvedValueOnce([createSnapshot('2024-12', null)])
      .mockResolvedValueOnce([createSnapshot('2024-12', 1200)]);
    prisma.importFile.findMany.mockResolvedValue([]);
    prisma.positionMonthlySnapshot.findMany
      .mockResolvedValueOnce([{ month: '2024-12', symbol: 'WMT' }])
      .mockResolvedValueOnce([]);
    prisma.priceHistory.findFirst.mockResolvedValue({
      symbol: 'WMT',
      date: new Date('2024-12-31T00:00:00.000Z'),
      close: new Prisma.Decimal(90.35),
      adjustedClose: new Prisma.Decimal(90.35),
      currency: 'USD',
    });
    const monthlySnapshotService = {
      generateMonthlySnapshots: jest.fn(),
      regenerateSnapshotsFromMonth: jest.fn(async () => ({
        generatedMonths: 1,
        warnings: [],
      })),
    };
    const service = new MonthlyTrendService(
      prisma as never,
      monthlySnapshotService as never,
    );

    const result = await service.getMonthlyTrend('user-1', 'ALL', 'ALL');

    expect(monthlySnapshotService.generateMonthlySnapshots).not.toHaveBeenCalled();
    expect(monthlySnapshotService.regenerateSnapshotsFromMonth).toHaveBeenCalledWith(
      'user-1',
      'ALL',
      '2024-12',
    );
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      month: '2024-12',
      totalAssets: 1200,
      warnings: [],
    });
  });
});
