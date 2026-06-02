import { Prisma } from '@prisma/client';
import { PortfolioStockDetailService } from './portfolio-stock-detail.service';
import { PortfolioHoldingItem } from './portfolio-positions.service';

function createPrismaMock() {
  return {
    priceHistory: {
      findMany: jest.fn(),
    },
    positionMonthlySnapshot: {
      findMany: jest.fn(),
    },
  };
}

function createHolding(
  overrides: Partial<PortfolioHoldingItem> = {},
): PortfolioHoldingItem {
  return {
    symbol: 'NVDA',
    name: 'Nvidia',
    quantity: 95,
    avgCost: 187.8,
    marketPrice: 224.36,
    costBasis: 17841,
    marketValue: 21314.2,
    unrealizedPnl: 3473.2,
    unrealizedReturnRate: 0.1947,
    weight: 0.3,
    currency: 'USD',
    warnings: [],
    ...overrides,
  };
}

describe('PortfolioStockDetailService', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-06-02T00:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns holding, symbol-scoped transactions, and cached daily price history', async () => {
    const prisma = createPrismaMock();
    prisma.priceHistory.findMany.mockResolvedValue([
      {
        date: new Date('2026-05-31T00:00:00.000Z'),
        close: new Prisma.Decimal(220),
        adjustedClose: new Prisma.Decimal(221.5),
        currency: 'USD',
      },
    ]);
    const positionsService = {
      getPositions: jest.fn(async () => ({
        holdings: [createHolding()],
        warnings: ['position warning'],
      })),
    };
    const transactionsService = {
      listTransactionItems: jest.fn(async () => ({
        transactions: [
          {
            id: 'tx-1',
            symbol: 'NVDA',
            side: 'BUY',
            date: '2026-04-22',
          },
        ],
        warnings: ['transaction warning'],
      })),
    };
    const service = new PortfolioStockDetailService(
      prisma as never,
      positionsService as never,
      transactionsService as never,
    );

    const result = await service.getStockDetail('user-1', 'nvda', '1M');

    expect(positionsService.getPositions).toHaveBeenCalledWith('user-1');
    expect(transactionsService.listTransactionItems).toHaveBeenCalledWith({
      userId: 'user-1',
      symbol: 'NVDA',
    });
    expect(prisma.priceHistory.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          symbol: 'NVDA',
          date: { gte: new Date('2026-05-02T00:00:00.000Z') },
        }),
      }),
    );
    expect(prisma.positionMonthlySnapshot.findMany).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      symbol: 'NVDA',
      holding: { symbol: 'NVDA', quantity: 95 },
      priceTrend: [
        {
          date: '2026-05-31',
          price: 221.5,
          currency: 'USD',
          source: 'PRICE_HISTORY',
        },
      ],
      warnings: ['position warning', 'transaction warning'],
    });
  });

  it('falls back to monthly position snapshots when daily history is empty', async () => {
    const prisma = createPrismaMock();
    prisma.priceHistory.findMany.mockResolvedValue([]);
    prisma.positionMonthlySnapshot.findMany.mockResolvedValue([
      {
        month: '2026-04',
        marketPrice: new Prisma.Decimal(180.25),
        currency: 'USD',
      },
      {
        month: '2026-05',
        marketPrice: new Prisma.Decimal(220.75),
        currency: 'USD',
      },
    ]);
    const positionsService = {
      getPositions: jest.fn(async () => ({
        holdings: [createHolding({ warnings: ['holding warning'] })],
        warnings: [],
      })),
    };
    const transactionsService = {
      listTransactionItems: jest.fn(async () => ({
        transactions: [],
        warnings: [],
      })),
    };
    const service = new PortfolioStockDetailService(
      prisma as never,
      positionsService as never,
      transactionsService as never,
    );

    const result = await service.getStockDetail('user-1', 'NVDA', '3M');

    expect(prisma.positionMonthlySnapshot.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: 'user-1',
          accountId: 'ALL',
          symbol: 'NVDA',
          month: { gte: '2026-03' },
          marketPrice: { not: null },
        }),
      }),
    );
    expect(result.priceTrend).toEqual([
      {
        date: '2026-04-01',
        price: 180.25,
        currency: 'USD',
        source: 'POSITION_SNAPSHOT',
      },
      {
        date: '2026-05-01',
        price: 220.75,
        currency: 'USD',
        source: 'POSITION_SNAPSHOT',
      },
    ]);
    expect(result.warnings).toEqual(['holding warning']);
  });
});
