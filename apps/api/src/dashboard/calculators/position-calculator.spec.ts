import { Prisma } from '@prisma/client';
import { calculatePositionCost } from './position-calculator';
import { DashboardEventRow } from './dashboard-calculator.types';

function createEvent(
  overrides: Partial<DashboardEventRow>,
): DashboardEventRow {
  return {
    id: `event_${overrides.rawRowIndex ?? 1}`,
    userId: overrides.userId ?? 'default_user',
    importFileId: 'import_1',
    source: 'IBKR_CSV',
    sourceEventHash: null,
    sourceFileName: 'sample.csv',
    sourceSection: 'sample',
    rawRowIndex: overrides.rawRowIndex ?? 1,
    rawData: {},
    tradeDate: overrides.tradeDate ?? new Date('2026-01-01T00:00:00.000Z'),
    accountId: 'U***66165',
    description: overrides.description ?? 'Sample',
    ibkrType: overrides.ibkrType ?? '',
    eventType: overrides.eventType ?? 'UNKNOWN',
    symbol: overrides.symbol ?? 'IBKR',
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

describe('calculatePositionCost', () => {
  it('does not count vested IBKR stock grant rows twice', () => {
    const result = calculatePositionCost([
      createEvent({
        rawRowIndex: 1,
        eventType: 'TRADE_BUY',
        quantity: new Prisma.Decimal(4.3876),
        absQuantity: new Prisma.Decimal(4.3876),
        netAmount: new Prisma.Decimal(-271.4),
        side: 'BUY',
        isTrade: true,
      }),
      createEvent({
        rawRowIndex: 2,
        eventType: 'STOCK_GRANT',
        description: '\u56e0\u73b0\u91d1\u5b58\u6b3e\u8d60\u4e0e\u80a1\u7968\u5956\u52b1',
        quantity: new Prisma.Decimal(0.5218),
        absQuantity: new Prisma.Decimal(0.5218),
        grossAmount: new Prisma.Decimal(30.58),
      }),
      createEvent({
        rawRowIndex: 3,
        eventType: 'STOCK_GRANT',
        description: '\u80a1\u7968\u5956\u52b1\u5151\u73b0',
        quantity: new Prisma.Decimal(3.032),
        absQuantity: new Prisma.Decimal(3.032),
        grossAmount: new Prisma.Decimal(192.24),
      }),
      createEvent({
        rawRowIndex: 4,
        eventType: 'TRANSFER_OUT',
        description: '\u80a1\u7968\u5956\u52b1\u9884\u6263\u7a0e',
        quantity: new Prisma.Decimal(-0.9094),
        absQuantity: new Prisma.Decimal(0.9094),
        grossAmount: new Prisma.Decimal(-57.66),
      }),
    ]);

    const ibkr = result.positions.find((position) => position.symbol === 'IBKR');

    expect(ibkr?.remainingQuantity.toNumber()).toBeCloseTo(4, 6);
  });
});
