import Decimal from 'decimal.js';
import { Prisma } from '@prisma/client';
import { DashboardService } from './dashboard.service';
import { MarketQuoteResult } from '../market-data/quote.types';

function createEvent(
  overrides: Partial<Prisma.TransactionEventGetPayload<object>>,
): Prisma.TransactionEventGetPayload<object> {
  return {
    id: `event_${overrides.rawRowIndex ?? 1}`,
    importFileId: overrides.importFileId ?? 'import_1',
    source: 'IBKR_CSV',
    sourceEventHash: overrides.sourceEventHash ?? null,
    sourceFileName: overrides.sourceFileName ?? 'sample.csv',
    sourceSection: 'Transaction History',
    rawRowIndex: overrides.rawRowIndex ?? 1,
    rawData: {},
    tradeDate: overrides.tradeDate ?? new Date('2026-01-01T00:00:00.000Z'),
    accountId: 'U***66165',
    description: overrides.description ?? 'Sample',
    ibkrType: overrides.ibkrType ?? '',
    eventType: overrides.eventType ?? 'UNKNOWN',
    symbol: overrides.symbol ?? null,
    quantity: overrides.quantity ?? null,
    absQuantity: overrides.absQuantity ?? null,
    price: overrides.price ?? null,
    currency: overrides.currency ?? 'USD',
    grossAmount: overrides.grossAmount ?? new Prisma.Decimal(0),
    commission: overrides.commission ?? new Prisma.Decimal(0),
    netAmount: overrides.netAmount ?? new Prisma.Decimal(0),
    side: overrides.side ?? null,
    isTrade: overrides.isTrade ?? false,
    isExternalCashFlow: overrides.isExternalCashFlow ?? false,
    isIncome: overrides.isIncome ?? false,
    isTaxOrFee: overrides.isTaxOrFee ?? false,
    createdAt: overrides.createdAt ?? new Date('2026-01-01T00:00:00.000Z'),
  };
}

function createPrismaMock(events: Prisma.TransactionEventGetPayload<object>[]) {
  return {
    importFile: {
      findMany: jest.fn(() => []),
    },
    transactionEvent: {
      findMany: jest.fn(({ where, take }: { where?: unknown; take?: number } = {}) => {
        if (where) {
          return events
            .filter(
              (event) =>
                event.eventType === 'TRADE_BUY' ||
                event.eventType === 'TRADE_SELL',
            )
            .sort((a, b) => {
              const dateDiff = b.tradeDate.getTime() - a.tradeDate.getTime();
              return dateDiff === 0 ? b.rawRowIndex - a.rawRowIndex : dateDiff;
            })
            .slice(0, take);
        }

        return [...events].sort((a, b) => {
          const dateDiff = a.tradeDate.getTime() - b.tradeDate.getTime();
          return dateDiff === 0 ? a.rawRowIndex - b.rawRowIndex : dateDiff;
        });
      }),
    },
  };
}

function createQuoteServiceMock(
  factory: (symbols: string[]) => MarketQuoteResult = (symbols) => ({
    quotesBySymbol: new Map(
      symbols.map((symbol) => [
        symbol,
        {
          symbol,
          providerSymbol: symbol,
          price: new Decimal(10),
          currency: 'USD',
          provider: 'YAHOO_FINANCE' as const,
          source: 'LIVE' as const,
          fetchedAt: new Date('2026-01-01T00:00:00.000Z'),
        },
      ]),
    ),
    warnings: [],
  }),
) {
  return {
    getCurrentQuotes: jest.fn(async (symbols: string[]) => factory(symbols)),
  };
}

function createService(
  events: Prisma.TransactionEventGetPayload<object>[],
  quoteFactory?: (symbols: string[]) => MarketQuoteResult,
) {
  return new DashboardService(
    createPrismaMock(events) as never,
    createQuoteServiceMock(quoteFactory) as never,
  );
}

describe('DashboardService', () => {
  it('returns empty dashboard data when transaction_events is empty', async () => {
    const service = createService([]);

    await expect(service.getSummary()).resolves.toMatchObject({
      totalAssets: 0,
      stockMarketValue: 0,
      cashBalance: 0,
      netDeposit: 0,
      realizedPnl: 0,
    });
    await expect(service.getAllocation()).resolves.toEqual([]);
    await expect(service.getAssetTrend()).resolves.toEqual([]);
    await expect(service.getRealizedPnlBySymbol()).resolves.toEqual([]);
  });

  it('filters asset trend by range from the latest available month', async () => {
    const events = [
      createEvent({
        rawRowIndex: 1,
        tradeDate: new Date('2025-11-15T00:00:00.000Z'),
        eventType: 'DEPOSIT',
        netAmount: new Prisma.Decimal(100),
      }),
      createEvent({
        rawRowIndex: 2,
        tradeDate: new Date('2025-12-15T00:00:00.000Z'),
        eventType: 'DEPOSIT',
        netAmount: new Prisma.Decimal(100),
      }),
      createEvent({
        rawRowIndex: 3,
        tradeDate: new Date('2026-01-15T00:00:00.000Z'),
        eventType: 'DEPOSIT',
        netAmount: new Prisma.Decimal(100),
      }),
      createEvent({
        rawRowIndex: 4,
        tradeDate: new Date('2026-03-15T00:00:00.000Z'),
        eventType: 'DEPOSIT',
        netAmount: new Prisma.Decimal(100),
      }),
      createEvent({
        rawRowIndex: 5,
        tradeDate: new Date('2026-04-15T00:00:00.000Z'),
        eventType: 'WITHDRAWAL',
        netAmount: new Prisma.Decimal(-50),
      }),
      createEvent({
        rawRowIndex: 6,
        tradeDate: new Date('2026-05-15T00:00:00.000Z'),
        eventType: 'DEPOSIT',
        netAmount: new Prisma.Decimal(200),
      }),
    ];
    const service = createService(events);

    const all = await service.getAssetTrend('ALL');
    const oneMonth = await service.getAssetTrend('1M');
    const threeMonths = await service.getAssetTrend('3M');
    const yearToDate = await service.getAssetTrend('YTD');
    const oneYear = await service.getAssetTrend('1Y');

    expect(all.map((point) => point.month)).toEqual([
      '2025-11',
      '2025-12',
      '2026-01',
      '2026-03',
      '2026-04',
      '2026-05',
    ]);
    expect(oneMonth.map((point) => point.month)).toEqual(['2026-05']);
    expect(threeMonths.map((point) => point.month)).toEqual([
      '2026-03',
      '2026-04',
      '2026-05',
    ]);
    expect(yearToDate.map((point) => point.month)).toEqual([
      '2026-01',
      '2026-03',
      '2026-04',
      '2026-05',
    ]);
    expect(oneYear.map((point) => point.month)).toEqual([
      '2025-11',
      '2025-12',
      '2026-01',
      '2026-03',
      '2026-04',
      '2026-05',
    ]);
    expect(oneMonth[0]).toMatchObject({
      totalAssets: 550,
      netDeposit: 550,
      totalPnl: 0,
    });
  });

  it('calculates realized P/L with FIFO method', async () => {
    const events = [
      createEvent({
        rawRowIndex: 1,
        eventType: 'DEPOSIT',
        netAmount: new Prisma.Decimal(1000),
        isExternalCashFlow: true,
      }),
      createEvent({
        rawRowIndex: 2,
        tradeDate: new Date('2026-01-02T00:00:00.000Z'),
        eventType: 'TRADE_BUY',
        symbol: 'AMD',
        quantity: new Prisma.Decimal(10),
        absQuantity: new Prisma.Decimal(10),
        price: new Prisma.Decimal(10),
        netAmount: new Prisma.Decimal(-100),
        side: 'BUY',
        isTrade: true,
      }),
      createEvent({
        rawRowIndex: 3,
        tradeDate: new Date('2026-01-03T00:00:00.000Z'),
        eventType: 'TRADE_BUY',
        symbol: 'AMD',
        quantity: new Prisma.Decimal(10),
        absQuantity: new Prisma.Decimal(10),
        price: new Prisma.Decimal(20),
        netAmount: new Prisma.Decimal(-200),
        side: 'BUY',
        isTrade: true,
      }),
      createEvent({
        rawRowIndex: 4,
        tradeDate: new Date('2026-01-04T00:00:00.000Z'),
        eventType: 'TRADE_SELL',
        symbol: 'AMD',
        quantity: new Prisma.Decimal(-5),
        absQuantity: new Prisma.Decimal(5),
        price: new Prisma.Decimal(30),
        netAmount: new Prisma.Decimal(150),
        side: 'SELL',
        isTrade: true,
      }),
    ];
    const service = createService(events);

    await expect(service.getRealizedPnlBySymbol()).resolves.toEqual([
      expect.objectContaining({
        symbol: 'AMD',
        realizedPnl: 100,
        totalAllocatedCost: 50,
        remainingQuantity: 15,
        remainingCost: 250,
        method: 'FIFO',
      }),
    ]);
  });

  it('only uses deposits and withdrawals for netDeposit and warns on oversell', async () => {
    const events = [
      createEvent({
        rawRowIndex: 1,
        eventType: 'DEPOSIT',
        netAmount: new Prisma.Decimal(1000),
      }),
      createEvent({
        rawRowIndex: 2,
        eventType: 'DIVIDEND',
        netAmount: new Prisma.Decimal(25),
      }),
      createEvent({
        rawRowIndex: 3,
        eventType: 'TRADE_BUY',
        symbol: 'MSFT',
        quantity: new Prisma.Decimal(1),
        absQuantity: new Prisma.Decimal(1),
        netAmount: new Prisma.Decimal(-100),
        side: 'BUY',
        isTrade: true,
      }),
      createEvent({
        rawRowIndex: 4,
        eventType: 'TRADE_SELL',
        symbol: 'MSFT',
        quantity: new Prisma.Decimal(-2),
        absQuantity: new Prisma.Decimal(2),
        netAmount: new Prisma.Decimal(220),
        side: 'SELL',
        isTrade: true,
      }),
    ];
    const service = createService(events);

    const summary = await service.getSummary();

    expect(summary.netDeposit).toBe(1000);
    expect(summary.realizedNetIncome).toBe(145);
    expect(summary.warnings?.some((warning) => warning.includes('MSFT sell quantity 2'))).toBe(true);
  });

  it('uses live quote price for stock market value', async () => {
    const events = [
      createEvent({
        rawRowIndex: 1,
        eventType: 'DEPOSIT',
        netAmount: new Prisma.Decimal(1000),
      }),
      createEvent({
        rawRowIndex: 2,
        eventType: 'TRADE_BUY',
        symbol: 'NVDA',
        quantity: new Prisma.Decimal(3),
        absQuantity: new Prisma.Decimal(3),
        netAmount: new Prisma.Decimal(-300),
        side: 'BUY',
        isTrade: true,
      }),
    ];
    const service = createService(events, () => ({
      quotesBySymbol: new Map([
        [
          'NVDA',
          {
            symbol: 'NVDA',
            providerSymbol: 'NVDA',
            price: new Decimal(150),
            currency: 'USD',
            provider: 'YAHOO_FINANCE',
            source: 'LIVE',
            fetchedAt: new Date('2026-01-01T00:00:00.000Z'),
          },
        ],
      ]),
      warnings: [],
    }));

    await expect(service.getSummary()).resolves.toMatchObject({
      stockMarketValue: 450,
      totalAssets: 1150,
      totalPnl: 150,
      totalReturn: 150,
      returnRate: 0.15,
    });
    await expect(service.getAssetTrend('1M')).resolves.toEqual([
      expect.objectContaining({
        month: '2026-01',
        totalAssets: 1000,
        netDeposit: 1000,
        totalPnl: 0,
        estimated: true,
      }),
    ]);
  });

  it('returns null market metrics when a holding quote is missing', async () => {
    const events = [
      createEvent({
        rawRowIndex: 1,
        eventType: 'DEPOSIT',
        netAmount: new Prisma.Decimal(1000),
      }),
      createEvent({
        rawRowIndex: 2,
        eventType: 'TRADE_BUY',
        symbol: 'MISSING',
        quantity: new Prisma.Decimal(1),
        absQuantity: new Prisma.Decimal(1),
        netAmount: new Prisma.Decimal(-100),
        side: 'BUY',
        isTrade: true,
      }),
    ];
    const service = createService(events, () => ({
      quotesBySymbol: new Map(),
      warnings: ['MISSING 行情获取失败。'],
    }));

    const summary = await service.getSummary();

    expect(summary.stockMarketValue).toBeNull();
    expect(summary.totalAssets).toBeNull();
    expect(summary.totalPnl).toBeNull();
    expect(summary.returnRate).toBeNull();
    expect(summary.warnings?.some((warning) => warning.includes('MISSING'))).toBe(true);
  });

  it('returns null returnRate when netDeposit is zero', async () => {
    const service = createService([
      createEvent({
        rawRowIndex: 1,
        eventType: 'DIVIDEND',
        netAmount: new Prisma.Decimal(10),
      }),
    ]);

    await expect(service.getSummary()).resolves.toMatchObject({
      netDeposit: 0,
      returnRate: null,
    });
  });
});
