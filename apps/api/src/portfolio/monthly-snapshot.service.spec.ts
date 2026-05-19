import { Prisma } from '@prisma/client';
import { MonthlySnapshotService } from './monthly-snapshot.service';

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
    accountId: overrides.accountId ?? 'ALL',
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

function createImportFile(
  overrides: Partial<Prisma.ImportFileGetPayload<object>>,
): Prisma.ImportFileGetPayload<object> {
  return {
    id: overrides.id ?? 'import_1',
    filename: overrides.filename ?? 'sample.csv',
    source: 'IBKR_CSV',
    fileHash: overrides.fileHash ?? `hash_${overrides.id ?? '1'}`,
    periodStart: overrides.periodStart ?? null,
    periodEnd: overrides.periodEnd ?? null,
    status: overrides.status ?? 'CONFIRMED',
    summary: overrides.summary ?? {},
    previewEvents: overrides.previewEvents ?? null,
    createdAt: overrides.createdAt ?? new Date('2026-01-01T00:00:00.000Z'),
    confirmedAt: overrides.confirmedAt ?? null,
  };
}

function toNumber(value: Prisma.Decimal.Value) {
  return new Prisma.Decimal(value).toNumber();
}

describe('MonthlySnapshotService', () => {
  it('uses the same import-summary cash basis as dashboard summary for month-end snapshots', async () => {
    const events = [
      createEvent({
        rawRowIndex: 1,
        tradeDate: new Date('2026-01-15T00:00:00.000Z'),
        eventType: 'DEPOSIT',
        netAmount: new Prisma.Decimal(1000),
      }),
      createEvent({
        rawRowIndex: 2,
        importFileId: 'import_2',
        tradeDate: new Date('2026-02-15T00:00:00.000Z'),
        eventType: 'DEPOSIT',
        netAmount: new Prisma.Decimal(200),
      }),
    ];
    const importFiles = [
      createImportFile({
        id: 'import_1',
        periodEnd: new Date('2026-01-31T00:00:00.000Z'),
        summary: {
          depositTotal: 1000,
          withdrawalTotal: 0,
          cashReport: {
            cashBalance: 950,
            deposits: 1000,
            withdrawals: 0,
          },
        },
      }),
      createImportFile({
        id: 'import_2',
        fileHash: 'hash_2',
        periodEnd: new Date('2026-02-28T00:00:00.000Z'),
        summary: {
          depositTotal: 300,
          withdrawalTotal: 0,
          cashReport: {
            cashBalance: 1400,
            deposits: 300,
            withdrawals: 0,
          },
        },
      }),
    ];
    const portfolioCreateMany = jest.fn();
    const positionCreateMany = jest.fn();
    const prisma = {
      transactionEvent: {
        findMany: jest.fn(async () => events),
      },
      importFile: {
        findMany: jest.fn(async () => importFiles),
      },
      positionMonthlySnapshot: {
        deleteMany: jest.fn(),
      },
      portfolioMonthlySnapshot: {
        deleteMany: jest.fn(),
      },
      $transaction: jest.fn(async (callback) =>
        callback({
          positionMonthlySnapshot: {
            deleteMany: jest.fn(),
            createMany: positionCreateMany,
          },
          portfolioMonthlySnapshot: {
            deleteMany: jest.fn(),
            createMany: portfolioCreateMany,
          },
        }),
      ),
    };
    const service = new MonthlySnapshotService(prisma as never, {
      getMonthEndClosePrice: jest.fn(),
    } as never);

    await service.generateMonthlySnapshots();

    expect(portfolioCreateMany).toHaveBeenCalledTimes(1);
    const rows = portfolioCreateMany.mock.calls[0][0].data;

    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      month: '2026-01',
      accountId: 'ALL',
    });
    expect(toNumber(rows[0].cashBalance)).toBe(950);
    expect(toNumber(rows[0].netDeposit)).toBe(1000);
    expect(toNumber(rows[0].totalAssets)).toBe(950);
    expect(toNumber(rows[0].totalReturn)).toBe(-50);

    expect(rows[1]).toMatchObject({
      month: '2026-02',
      accountId: 'ALL',
    });
    expect(toNumber(rows[1].cashBalance)).toBe(1400);
    expect(toNumber(rows[1].netDeposit)).toBe(1300);
    expect(toNumber(rows[1].totalAssets)).toBe(1400);
    expect(toNumber(rows[1].totalReturn)).toBe(100);
  });
});
