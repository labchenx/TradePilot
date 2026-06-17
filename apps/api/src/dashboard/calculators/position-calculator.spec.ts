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
    rawData: overrides.rawData ?? {},
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
  it('tracks opening short sells separately from long lots', () => {
    const result = calculatePositionCost([
      createEvent({
        rawRowIndex: 1,
        eventType: 'TRADE_SELL',
        symbol: 'ORCL',
        quantity: new Prisma.Decimal(-10),
        absQuantity: new Prisma.Decimal(10),
        netAmount: new Prisma.Decimal(3330),
        side: 'SELL',
        isTrade: true,
      }),
      createEvent({
        rawRowIndex: 2,
        eventType: 'TRADE_BUY',
        symbol: 'ORCL',
        quantity: new Prisma.Decimal(10),
        absQuantity: new Prisma.Decimal(10),
        netAmount: new Prisma.Decimal(-3347.7),
        side: 'BUY',
        isTrade: true,
      }),
    ]);

    const orcl = result.positions.find((position) => position.symbol === 'ORCL');

    expect(orcl?.remainingQuantity.toNumber()).toBe(0);
    expect(orcl?.realizedPnl.toNumber()).toBeCloseTo(-17.7, 6);
    expect(
      result.warnings.some((warning) =>
        warning.includes('ORCL sell quantity 10'),
      ),
    ).toBe(false);
  });

  it('reduces long lots for transfer-out without recording a sale', () => {
    const result = calculatePositionCost([
      createEvent({
        rawRowIndex: 1,
        eventType: 'TRADE_BUY',
        symbol: 'ORCL',
        quantity: new Prisma.Decimal(4),
        absQuantity: new Prisma.Decimal(4),
        netAmount: new Prisma.Decimal(-1100.6),
        side: 'BUY',
        isTrade: true,
      }),
      createEvent({
        rawRowIndex: 2,
        eventType: 'TRANSFER_OUT',
        symbol: 'ORCL',
        quantity: new Prisma.Decimal(-4),
        absQuantity: new Prisma.Decimal(4),
        grossAmount: new Prisma.Decimal(-1100.6),
      }),
    ]);

    const orcl = result.positions.find((position) => position.symbol === 'ORCL');

    expect(orcl?.remainingQuantity.toNumber()).toBe(0);
    expect(orcl?.realizedPnl.toNumber()).toBe(0);
    expect(
      result.warnings.some((warning) =>
        warning.includes('ORCL transfer-out quantity 4'),
      ),
    ).toBe(false);
  });

  it('uses raw execution time before raw row index for same-day FIFO lots', () => {
    const tradeDate = new Date('2026-04-10T00:00:00.000Z');
    const result = calculatePositionCost([
      createEvent({
        rawRowIndex: 1,
        rawData: { tradeDateTime: '2026-04-10 10:00:00' },
        tradeDate,
        eventType: 'TRADE_BUY',
        symbol: 'NVDA',
        quantity: new Prisma.Decimal(10),
        absQuantity: new Prisma.Decimal(10),
        netAmount: new Prisma.Decimal(-2000),
        side: 'BUY',
        isTrade: true,
      }),
      createEvent({
        rawRowIndex: 2,
        rawData: { tradeDateTime: '2026-04-10 11:00:00' },
        tradeDate,
        eventType: 'TRADE_SELL',
        symbol: 'NVDA',
        quantity: new Prisma.Decimal(-10),
        absQuantity: new Prisma.Decimal(10),
        netAmount: new Prisma.Decimal(1500),
        side: 'SELL',
        isTrade: true,
      }),
      createEvent({
        rawRowIndex: 3,
        rawData: { tradeDateTime: '2026-04-10 09:00:00' },
        tradeDate,
        eventType: 'TRADE_BUY',
        symbol: 'NVDA',
        quantity: new Prisma.Decimal(10),
        absQuantity: new Prisma.Decimal(10),
        netAmount: new Prisma.Decimal(-1000),
        side: 'BUY',
        isTrade: true,
      }),
    ]);

    const nvda = result.positions.find((position) => position.symbol === 'NVDA');

    expect(nvda?.remainingQuantity.toNumber()).toBe(10);
    expect(nvda?.averageCost.toNumber()).toBe(200);
  });

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
