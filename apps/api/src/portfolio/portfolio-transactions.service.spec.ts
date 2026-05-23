import { Prisma } from '@prisma/client';
import { PortfolioTransactionsService } from './portfolio-transactions.service';

function tradeEvent(overrides: Record<string, unknown> = {}) {
  return {
    id: 'event-1',
    userId: 'default_user',
    importFileId: 'import-1',
    source: 'IBKR_CSV',
    sourceEventHash: 'hash-1',
    sourceFileName: 'sample.csv',
    sourceSection: 'Trades',
    rawRowIndex: 1,
    rawData: {},
    tradeDate: new Date('2026-01-01T00:00:00.000Z'),
    accountId: 'U123',
    description: 'Microsoft Corporation',
    ibkrType: 'Buy',
    eventType: 'TRADE_BUY',
    symbol: 'MSFT',
    quantity: new Prisma.Decimal(10),
    absQuantity: new Prisma.Decimal(10),
    price: new Prisma.Decimal(100),
    currency: 'USD',
    grossAmount: new Prisma.Decimal(-1000),
    commission: new Prisma.Decimal(-1),
    netAmount: new Prisma.Decimal(-1001),
    side: 'BUY',
    isTrade: true,
    isExternalCashFlow: false,
    isIncome: false,
    isTaxOrFee: false,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

describe('PortfolioTransactionsService', () => {
  it('returns only stock buy and sell transactions with summary metrics', async () => {
    const rows = [
      tradeEvent({ id: 'buy-1' }),
      tradeEvent({
        id: 'sell-1',
        tradeDate: new Date('2026-01-03T00:00:00.000Z'),
        eventType: 'TRADE_SELL',
        side: 'SELL',
        quantity: new Prisma.Decimal(-4),
        absQuantity: new Prisma.Decimal(4),
        price: new Prisma.Decimal(125),
        grossAmount: new Prisma.Decimal(500),
        commission: new Prisma.Decimal(-1),
        netAmount: new Prisma.Decimal(499),
        rawData: { '\u5df2\u5b9e\u73b0\u7684\u635f\u76ca': '96.50' },
      }),
      tradeEvent({
        id: 'dividend-1',
        eventType: 'DIVIDEND',
        side: null,
        symbol: 'MSFT',
        isTrade: false,
        netAmount: new Prisma.Decimal(10),
      }),
    ];
    const prisma = {
      transactionEvent: {
        findMany: jest.fn().mockResolvedValue(rows),
      },
    };
    const service = new PortfolioTransactionsService(prisma as never);

    const result = await service.getTransactions({ page: 1, pageSize: 50 });

    expect(prisma.transactionEvent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          isTrade: true,
          symbol: { not: null },
        }),
      }),
    );
    expect(result.transactions).toHaveLength(2);
    expect(result.transactions[0]).toMatchObject({
      id: 'sell-1',
      side: 'SELL',
      quantity: 4,
      amount: 499,
      realizedPnl: 96.5,
    });
    expect(result.summary).toMatchObject({
      totalTrades: 2,
      buyAmount: 1001,
      sellAmount: 499,
      commission: 2,
      realizedPnl: 96.5,
      tradedSymbolCount: 1,
    });
  });

  it('supports query parameters and warns when sell realizedPnl is missing', async () => {
    const prisma = {
      transactionEvent: {
        findMany: jest.fn().mockResolvedValue([
          tradeEvent({
            id: 'sell-1',
            tradeDate: new Date('2026-01-03T00:00:00.000Z'),
            eventType: 'TRADE_SELL',
            side: 'SELL',
            quantity: new Prisma.Decimal(-4),
            absQuantity: new Prisma.Decimal(4),
            netAmount: new Prisma.Decimal(499),
          }),
        ]),
      },
    };
    const service = new PortfolioTransactionsService(prisma as never);

    const result = await service.getTransactions({
      search: 'msft',
      side: 'SELL',
      sortBy: 'realizedPnl',
      sortDirection: 'desc',
      page: 1,
      pageSize: 20,
    });

    expect(prisma.transactionEvent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          side: 'SELL',
          OR: [
            { symbol: { contains: 'msft', mode: 'insensitive' } },
            { description: { contains: 'msft', mode: 'insensitive' } },
          ],
        }),
      }),
    );
    expect(result.transactions[0].realizedPnl).toBeNull();
    expect(result.warnings.join('\n')).toContain(
      'SELL trade rows do not include IBKR realizedPnl',
    );
  });
});
