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
    const prisma: any = {
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
          isExternalCashFlow: false,
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

  it('excludes external cash flow rows even if imported flags are malformed', async () => {
    const rows = [
      tradeEvent({ id: 'buy-1' }),
      tradeEvent({
        id: 'bad-deposit',
        eventType: 'DEPOSIT',
        symbol: 'USD',
        side: 'BUY',
        quantity: null,
        absQuantity: null,
        price: null,
        netAmount: new Prisma.Decimal(10000),
        isTrade: true,
        isExternalCashFlow: true,
      }),
    ];
    const prisma: any = {
      transactionEvent: {
        findMany: jest.fn().mockResolvedValue(rows),
      },
    };
    const service = new PortfolioTransactionsService(prisma as never);

    const result = await service.getTransactions({ page: 1, pageSize: 50 });

    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0].id).toBe('buy-1');
    expect(result.summary).toMatchObject({
      totalTrades: 1,
      buyAmount: 1001,
      sellAmount: 0,
    });
  });

  it('supports query parameters and warns when sell realizedPnl is missing', async () => {
    let prisma: any;
    prisma = {
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

  it('corrects an imported email PDF BUY row to SELL and updates signed fields', async () => {
    const row = tradeEvent({
      id: 'brk-bug',
      userId: 'user-1',
      source: 'IBKR_EMAIL_PDF',
      sourceEventHash: 'old-buy-hash',
      sourceFileName: 'DailyTradeReport.20260615.pdf',
      description: 'IBKR Email PDF BUY BRK B',
      ibkrType: 'BUY',
      symbol: 'BRK B',
      quantity: new Prisma.Decimal(4),
      absQuantity: new Prisma.Decimal(4),
      price: new Prisma.Decimal(489.4),
      grossAmount: new Prisma.Decimal(1957.2),
      commission: new Prisma.Decimal(-0.4),
      netAmount: new Prisma.Decimal(1956.8),
      side: 'BUY',
      rawData: {
        source: 'IBKR_EMAIL_PDF',
        accountId: 'U***66165',
        symbol: 'BRK B',
        tradeDateTime: '2026-06-15 09:30:00',
        tradeDate: '2026-06-15',
        settleDate: '2026-06-16',
        side: 'BUY',
        quantity: 4,
        price: 489.4,
        proceeds: 1957.2,
        commission: -0.4,
        fee: 0,
        currency: 'USD',
        orderType: 'LMT',
        code: 'C',
      },
    });
    const prisma = {
      transactionEvent: {
        findUnique: jest.fn().mockResolvedValue(row),
        findFirst: jest.fn().mockResolvedValue(null),
        update: jest.fn().mockImplementation(({ data }) =>
          Promise.resolve({
            ...row,
            ...data,
          }),
        ),
      },
      importRecord: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      $transaction: jest.fn((callback: (tx: any) => unknown): unknown =>
        callback(prisma),
      ),
    };
    const service = new PortfolioTransactionsService(prisma as never);

    const result = await service.updateTransactionSide('user-1', 'brk-bug', 'SELL');
    const updateData = prisma.transactionEvent.update.mock.calls[0][0].data;

    expect(prisma.transactionEvent.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: 'user-1',
          id: { not: 'brk-bug' },
        }),
      }),
    );
    expect(updateData).toMatchObject({
      description: 'IBKR Email PDF SELL BRK B',
      ibkrType: 'SELL',
      eventType: 'TRADE_SELL',
      side: 'SELL',
    });
    expect(updateData.sourceEventHash).not.toBe('old-buy-hash');
    expect(updateData.quantity.toString()).toBe('-4');
    expect(updateData.grossAmount.toString()).toBe('1957.2');
    expect(updateData.netAmount.toString()).toBe('1956.8');
    expect(updateData.rawData).toMatchObject({
      side: 'SELL',
      sourceHash: updateData.sourceEventHash,
    });
    expect(prisma.importRecord.updateMany).toHaveBeenCalledWith({
      where: {
        userId: 'user-1',
        sourceHash: 'old-buy-hash',
      },
      data: {
        sourceHash: updateData.sourceEventHash,
      },
    });
    expect(result).toMatchObject({
      id: 'brk-bug',
      side: 'SELL',
      quantity: 4,
      amount: 1956.8,
    });
  });
});
