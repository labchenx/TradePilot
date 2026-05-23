import { Prisma } from '@prisma/client';
import { TransactionEventsService } from './transaction-events.service';

describe('TransactionEventsService', () => {
  it('returns paginated transaction events', async () => {
    const row = {
      id: 'event_1',
      userId: 'default_user',
      importFileId: 'import_1',
      source: 'IBKR_CSV',
      sourceFileName: 'sample.csv',
      sourceSection: 'Transaction History',
      rawRowIndex: 11,
      rawData: { 交易类型: '买' },
      tradeDate: new Date('2026-05-05T00:00:00.000Z'),
      accountId: 'U***66165',
      description: 'BERKSHIRE HATHAWAY INC-CL B',
      ibkrType: '买',
      eventType: 'TRADE_BUY',
      symbol: 'BRK B',
      quantity: new Prisma.Decimal(2),
      absQuantity: new Prisma.Decimal(2),
      price: new Prisma.Decimal(466.8),
      currency: 'USD',
      grossAmount: new Prisma.Decimal(-933.6),
      commission: new Prisma.Decimal(-0.34426325),
      netAmount: new Prisma.Decimal(-933.94426325),
      side: 'BUY',
      isTrade: true,
      isExternalCashFlow: false,
      isIncome: false,
      isTaxOrFee: false,
      createdAt: new Date('2026-05-12T00:00:00.000Z'),
    };

    const prisma = {
      transactionEvent: {
        findMany: jest.fn(() => [row]),
        count: jest.fn(() => 1),
      },
      $transaction: jest.fn((items: unknown[]) => items),
    };
    const service = new TransactionEventsService(prisma as never);

    const result = await service.findAll({ page: 1, pageSize: 50 });

    expect(result.total).toBe(1);
    expect(result.list[0]).toMatchObject({
      id: 'event_1',
      tradeDate: '2026-05-05',
      quantity: 2,
      netAmount: -933.94426325,
    });
  });
});
