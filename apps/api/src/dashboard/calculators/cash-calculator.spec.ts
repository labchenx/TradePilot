import { Prisma } from '@prisma/client';
import { calculateCashMetrics } from './cash-calculator';

function createEvent(
  overrides: Partial<Prisma.TransactionEventGetPayload<object>>,
): Prisma.TransactionEventGetPayload<object> {
  return {
    id: `event_${overrides.rawRowIndex ?? 1}`,
    userId: overrides.userId ?? 'default_user',
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
    userId: overrides.userId ?? 'default_user',
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

describe('calculateCashMetrics', () => {
  it('uses an IBKR cash report as an anchor and applies later cash movements', () => {
    const result = calculateCashMetrics(
      [
        createEvent({
          rawRowIndex: 1,
          tradeDate: new Date('2026-01-31T00:00:00.000Z'),
          eventType: 'TRADE_BUY',
          netAmount: new Prisma.Decimal(-500),
        }),
        createEvent({
          rawRowIndex: 2,
          tradeDate: new Date('2026-02-01T00:00:00.000Z'),
          eventType: 'TRADE_BUY',
          netAmount: new Prisma.Decimal(-300),
        }),
        createEvent({
          rawRowIndex: 3,
          tradeDate: new Date('2026-02-02T00:00:00.000Z'),
          eventType: 'DEPOSIT',
          netAmount: new Prisma.Decimal(50),
        }),
      ],
      [
        createImportFile({
          periodEnd: new Date('2026-01-31T00:00:00.000Z'),
          summary: {
            depositTotal: 100,
            withdrawalTotal: 0,
            cashReport: {
              cashBalance: 1000,
              deposits: 100,
              withdrawals: 0,
              buyCash: -500,
            },
          },
        }),
      ],
    );

    expect(result.cashBalance.toNumber()).toBe(750);
    expect(result.netDeposit.toNumber()).toBe(150);
    expect(result.cashDebug.buyCash).toBe(-800);
    expect(result.cashDebug.source).toBe('IBKR_CASH_REPORT');
    expect(result.netDepositDebug.netDeposit).toBe(150);
  });
});
