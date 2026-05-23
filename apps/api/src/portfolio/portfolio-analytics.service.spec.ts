import { CashFlowType, Prisma } from '@prisma/client';
import Decimal from 'decimal.js';
import { PortfolioAnalyticsService } from './portfolio-analytics.service';
import { PortfolioPositionsResponse } from './portfolio-positions.service';

function createEvent(
  overrides: Partial<Prisma.TransactionEventGetPayload<object>>,
): Prisma.TransactionEventGetPayload<object> {
  return {
    id: `event-${overrides.rawRowIndex ?? 1}`,
    userId: overrides.userId ?? 'default_user',
    importFileId: overrides.importFileId ?? 'import-1',
    source: 'IBKR_CSV',
    sourceEventHash: overrides.sourceEventHash ?? null,
    sourceFileName: overrides.sourceFileName ?? 'sample.csv',
    sourceSection: overrides.sourceSection ?? 'Statement',
    rawRowIndex: overrides.rawRowIndex ?? 1,
    rawData: overrides.rawData ?? {},
    tradeDate: overrides.tradeDate ?? new Date('2026-01-01T00:00:00.000Z'),
    accountId: overrides.accountId ?? 'U123',
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

function createCashFlow(
  overrides: Partial<Prisma.CashFlowGetPayload<object>> = {},
): Prisma.CashFlowGetPayload<object> {
  return {
    id: overrides.id ?? 'cash-1',
    userId: overrides.userId ?? 'default_user',
    accountId: overrides.accountId ?? 'U123',
    type: overrides.type ?? CashFlowType.DEPOSIT,
    amount: overrides.amount ?? new Prisma.Decimal(1000),
    currency: overrides.currency ?? 'USD',
    flowDate: overrides.flowDate ?? new Date('2026-01-01T00:00:00.000Z'),
    source: overrides.source ?? 'IBKR_CSV',
    sourceHash: overrides.sourceHash ?? null,
    rawData: overrides.rawData ?? {},
    remark: overrides.remark ?? null,
    createdAt: overrides.createdAt ?? new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: overrides.updatedAt ?? new Date('2026-01-01T00:00:00.000Z'),
  };
}

function createSnapshot(
  overrides: Partial<Prisma.PortfolioMonthlySnapshotGetPayload<object>> = {},
): Prisma.PortfolioMonthlySnapshotGetPayload<object> {
  return {
    id: overrides.id ?? 'snapshot-1',
    userId: overrides.userId ?? 'default_user',
    accountId: overrides.accountId ?? 'ALL',
    month: overrides.month ?? '2026-01',
    snapshotDate:
      overrides.snapshotDate ?? new Date('2026-01-31T00:00:00.000Z'),
    cashBalance: overrides.cashBalance ?? new Prisma.Decimal(1000),
    stockMarketValue: overrides.stockMarketValue ?? new Prisma.Decimal(750),
    totalAssets: overrides.totalAssets ?? new Prisma.Decimal(1750),
    netDeposit: overrides.netDeposit ?? new Prisma.Decimal(2000),
    totalReturn: overrides.totalReturn ?? new Prisma.Decimal(-250),
    realizedPnl: overrides.realizedPnl ?? new Prisma.Decimal(0),
    realizedNetIncome: overrides.realizedNetIncome ?? new Prisma.Decimal(0),
    createdAt: overrides.createdAt ?? new Date('2026-01-31T00:00:00.000Z'),
    updatedAt: overrides.updatedAt ?? new Date('2026-01-31T00:00:00.000Z'),
  };
}

function createImportFile(
  overrides: Partial<Prisma.ImportFileGetPayload<object>> = {},
): Prisma.ImportFileGetPayload<object> {
  return {
    id: overrides.id ?? 'import-1',
    userId: overrides.userId ?? 'default_user',
    filename: overrides.filename ?? 'sample.csv',
    source: overrides.source ?? 'IBKR_CSV',
    fileHash: overrides.fileHash ?? 'file-hash-1',
    periodStart: overrides.periodStart ?? new Date('2026-01-01T00:00:00.000Z'),
    periodEnd: overrides.periodEnd ?? new Date('2026-01-31T00:00:00.000Z'),
    status: overrides.status ?? 'CONFIRMED',
    summary:
      overrides.summary ??
      ({
        depositTotal: 2000,
        withdrawalTotal: 0,
        cashReport: {
          cashBalance: 1600,
          deposits: 2000,
          withdrawals: 0,
        },
      } as Prisma.JsonObject),
    previewEvents: overrides.previewEvents ?? null,
    createdAt: overrides.createdAt ?? new Date('2026-01-31T00:00:00.000Z'),
    confirmedAt:
      overrides.confirmedAt ?? new Date('2026-01-31T00:00:00.000Z'),
  };
}

function emptyPositions(): PortfolioPositionsResponse {
  return {
    summary: {
      numberOfHoldings: 0,
      totalMarketValue: 0,
      totalCost: 0,
      unrealizedPnl: 0,
      unrealizedReturnRate: null,
      warnings: [],
    },
    holdings: [],
    allocation: [],
    pnlBySymbol: [],
    updatedAt: '2026-01-01T00:00:00.000Z',
    warnings: [],
  };
}

function msftPositions(): PortfolioPositionsResponse {
  return {
    summary: {
      numberOfHoldings: 1,
      totalMarketValue: 750,
      totalCost: 500,
      unrealizedPnl: 250,
      unrealizedReturnRate: 0.5,
      warnings: [],
    },
    holdings: [
      {
        symbol: 'MSFT',
        name: 'Microsoft Corporation',
        quantity: 5,
        avgCost: 100,
        marketPrice: 150,
        costBasis: 500,
        marketValue: 750,
        unrealizedPnl: 250,
        unrealizedReturnRate: 0.5,
        weight: 1,
        currency: 'USD',
        warnings: [],
      },
    ],
    allocation: [{ symbol: 'MSFT', marketValue: 750, weight: 1 }],
    pnlBySymbol: [{ symbol: 'MSFT', unrealizedPnl: 250 }],
    updatedAt: '2026-01-02T00:00:00.000Z',
    warnings: [],
  };
}

function createService({
  events = [],
  importFiles = [],
  cashFlows = [],
  snapshots = [],
  missingPriceRows = [],
  positions = emptyPositions(),
}: {
  events?: Prisma.TransactionEventGetPayload<object>[];
  importFiles?: Prisma.ImportFileGetPayload<object>[];
  cashFlows?: Prisma.CashFlowGetPayload<object>[];
  snapshots?: Prisma.PortfolioMonthlySnapshotGetPayload<object>[];
  missingPriceRows?: Array<{ month: string; symbol: string }>;
  positions?: PortfolioPositionsResponse;
}) {
  const prisma = {
    transactionEvent: {
      findMany: jest.fn().mockResolvedValue(events),
    },
    importFile: {
      findMany: jest.fn().mockResolvedValue(importFiles),
    },
    cashFlow: {
      findMany: jest.fn().mockResolvedValue(cashFlows),
    },
    portfolioMonthlySnapshot: {
      findMany: jest.fn().mockResolvedValue(snapshots),
    },
    positionMonthlySnapshot: {
      findMany: jest.fn().mockResolvedValue(missingPriceRows),
    },
  };
  const portfolioPositionsService = {
    getPositions: jest.fn().mockResolvedValue(positions),
  };

  return {
    service: new PortfolioAnalyticsService(
      prisma as never,
      portfolioPositionsService as never,
    ),
    prisma,
  };
}

describe('PortfolioAnalyticsService', () => {
  it('returns a safe empty response without regenerating snapshots', async () => {
    const { service, prisma } = createService({});

    const result = await service.getAnalytics();

    expect(result.summary).toMatchObject({
      totalAssets: 0,
      totalReturn: 0,
      returnRate: null,
      realizedPnl: 0,
      unrealizedPnl: 0,
      netDeposit: 0,
    });
    expect(result.assetTrend).toEqual([]);
    expect(result.allocation).toEqual([]);
    expect(result.pnlContribution).toEqual([]);
    expect(result.monthlyCashFlows).toEqual([]);
    expect(result.warnings.join('\n')).toContain(
      'No portfolio monthly snapshots found',
    );
    expect(prisma.portfolioMonthlySnapshot.findMany).toHaveBeenCalledTimes(1);
  });

  it('builds analytics from cash_flows, transaction events, positions, and snapshots', async () => {
    const events = [
      createEvent({
        rawRowIndex: 1,
        eventType: 'TRADE_BUY',
        symbol: 'MSFT',
        quantity: new Prisma.Decimal(10),
        absQuantity: new Prisma.Decimal(10),
        price: new Prisma.Decimal(100),
        netAmount: new Prisma.Decimal(-1000),
        side: 'BUY',
        isTrade: true,
      }),
      createEvent({
        rawRowIndex: 2,
        eventType: 'TRADE_SELL',
        symbol: 'MSFT',
        quantity: new Prisma.Decimal(-5),
        absQuantity: new Prisma.Decimal(5),
        price: new Prisma.Decimal(120),
        netAmount: new Prisma.Decimal(600),
        side: 'SELL',
        isTrade: true,
        rawData: { '已实现损益': '100' },
      }),
    ];
    const cashFlows = [
      createCashFlow({
        id: 'deposit-1',
        amount: new Prisma.Decimal(2000),
        flowDate: new Date('2026-01-03T00:00:00.000Z'),
      }),
    ];
    const { service } = createService({
      events,
      importFiles: [createImportFile()],
      cashFlows,
      snapshots: [
        createSnapshot({
          totalAssets: new Prisma.Decimal(2350),
          netDeposit: new Prisma.Decimal(2000),
          totalReturn: new Prisma.Decimal(350),
        }),
      ],
      positions: msftPositions(),
    });

    const result = await service.getAnalytics();

    expect(result.summary).toMatchObject({
      totalAssets: 2350,
      totalReturn: 350,
      returnRate: 0.175,
      realizedPnl: 100,
      unrealizedPnl: 250,
      netDeposit: 2000,
    });
    expect(result.assetTrend).toEqual([
      {
        month: '2026-01',
        date: '2026-01-31',
        totalAssets: 2350,
        netDeposit: 2000,
        totalReturn: 350,
      },
    ]);
    expect(result.allocation).toEqual([
      {
        symbol: 'MSFT',
        name: 'Microsoft Corporation',
        marketValue: 750,
        weight: 1,
      },
    ]);
    expect(result.pnlContribution).toEqual([
      {
        symbol: 'MSFT',
        name: 'Microsoft Corporation',
        realizedPnl: 100,
        unrealizedPnl: 250,
        totalPnl: 350,
      },
    ]);
    expect(result.realizedVsUnrealized).toEqual({
      realizedPnl: 100,
      unrealizedPnl: 250,
    });
    expect(result.monthlyCashFlows).toEqual([
      {
        month: '2026-01',
        deposits: 2000,
        withdrawals: 0,
        netDepositChange: 2000,
      },
    ]);
  });

  it('returns null returnRate when netDeposit is zero', async () => {
    const { service } = createService({
      positions: msftPositions(),
      events: [
        createEvent({
          rawRowIndex: 1,
          eventType: 'TRADE_BUY',
          symbol: 'MSFT',
          quantity: new Prisma.Decimal(5),
          absQuantity: new Prisma.Decimal(5),
          price: new Prisma.Decimal(100),
          netAmount: new Prisma.Decimal(-500),
          side: 'BUY',
          isTrade: true,
        }),
      ],
      snapshots: [createSnapshot()],
    });

    const result = await service.getAnalytics();

    expect(result.summary.netDeposit).toBe(0);
    expect(result.summary.returnRate).toBeNull();
  });

  it('keeps market-dependent metrics null when current quote data is missing', async () => {
    const missingQuotePositions: PortfolioPositionsResponse = {
      ...msftPositions(),
      summary: {
        ...msftPositions().summary,
        totalMarketValue: null,
        unrealizedPnl: null,
        warnings: ['MSFT quote is missing.'],
      },
      holdings: [
        {
          ...msftPositions().holdings[0],
          marketPrice: null,
          marketValue: null,
          unrealizedPnl: null,
          unrealizedReturnRate: null,
          weight: null,
          warnings: ['MSFT quote is missing.'],
        },
      ],
      warnings: ['MSFT quote is missing.'],
    };
    const { service } = createService({
      positions: missingQuotePositions,
      cashFlows: [createCashFlow({ amount: new Prisma.Decimal(1000) })],
      events: [],
      snapshots: [createSnapshot({ totalAssets: null, totalReturn: null })],
      missingPriceRows: [{ month: '2026-01', symbol: 'MSFT' }],
    });

    const result = await service.getAnalytics();

    expect(result.summary.totalAssets).toBeNull();
    expect(result.summary.totalReturn).toBeNull();
    expect(result.summary.unrealizedPnl).toBeNull();
    expect(result.pnlContribution[0]).toMatchObject({
      symbol: 'MSFT',
      unrealizedPnl: null,
      totalPnl: null,
    });
    expect(result.warnings.join('\n')).toContain('MSFT');
  });

  it('sorts P/L contribution by totalPnl and falls back to FIFO when IBKR realized P/L is absent', async () => {
    const positions: PortfolioPositionsResponse = {
      ...msftPositions(),
      summary: {
        ...msftPositions().summary,
        numberOfHoldings: 2,
        totalMarketValue: 1250,
        totalCost: 1000,
        unrealizedPnl: 250,
      },
      holdings: [
        {
          ...msftPositions().holdings[0],
          symbol: 'MSFT',
          unrealizedPnl: 250,
          marketValue: 750,
          weight: 0.6,
        },
        {
          ...msftPositions().holdings[0],
          symbol: 'AAPL',
          name: 'Apple Inc.',
          quantity: 5,
          costBasis: 500,
          marketValue: 500,
          unrealizedPnl: 0,
          weight: 0.4,
        },
      ],
    };
    const events = [
      createEvent({
        rawRowIndex: 1,
        eventType: 'TRADE_BUY',
        symbol: 'MSFT',
        quantity: new Prisma.Decimal(5),
        absQuantity: new Prisma.Decimal(5),
        price: new Prisma.Decimal(100),
        netAmount: new Prisma.Decimal(-500),
        side: 'BUY',
        isTrade: true,
      }),
      createEvent({
        rawRowIndex: 2,
        eventType: 'TRADE_BUY',
        symbol: 'AAPL',
        quantity: new Prisma.Decimal(10),
        absQuantity: new Prisma.Decimal(10),
        price: new Prisma.Decimal(50),
        netAmount: new Prisma.Decimal(-500),
        side: 'BUY',
        isTrade: true,
      }),
      createEvent({
        rawRowIndex: 3,
        eventType: 'TRADE_SELL',
        symbol: 'AAPL',
        quantity: new Prisma.Decimal(-5),
        absQuantity: new Prisma.Decimal(5),
        price: new Prisma.Decimal(80),
        netAmount: new Prisma.Decimal(400),
        side: 'SELL',
        isTrade: true,
      }),
    ];
    const { service } = createService({
      events,
      positions,
      snapshots: [createSnapshot()],
    });

    const result = await service.getAnalytics();

    expect(result.pnlContribution.map((item) => item.symbol)).toEqual([
      'MSFT',
      'AAPL',
    ]);
    expect(result.pnlContribution.find((item) => item.symbol === 'AAPL')).toMatchObject({
      realizedPnl: 150,
      unrealizedPnl: 0,
      totalPnl: 150,
    });
    expect(result.warnings.join('\n')).toContain('FIFO');
  });
});
