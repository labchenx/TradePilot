import { Prisma } from '@prisma/client';
import { DashboardEventRow } from './dashboard-calculator.types';
import { deduplicateDashboardEvents } from './deduplicate-events.util';

function createEvent(overrides: Partial<DashboardEventRow>): DashboardEventRow {
  return {
    id: overrides.id ?? `event_${overrides.rawRowIndex ?? 1}`,
    userId: overrides.userId ?? 'user_1',
    importFileId: overrides.importFileId ?? 'import_1',
    source: overrides.source ?? 'IBKR_CSV',
    sourceEventHash: overrides.sourceEventHash ?? null,
    sourceFileName: overrides.sourceFileName ?? 'sample.csv',
    sourceSection: overrides.sourceSection ?? 'sample',
    rawRowIndex: overrides.rawRowIndex ?? 1,
    rawData: overrides.rawData ?? {},
    tradeDate: overrides.tradeDate ?? new Date('2026-05-27T00:00:00.000Z'),
    accountId: overrides.accountId ?? 'U18666165',
    description: overrides.description ?? '股票交易 NVDA',
    ibkrType: overrides.ibkrType ?? 'BUY',
    eventType: overrides.eventType ?? 'TRADE_BUY',
    symbol: overrides.symbol ?? 'NVDA',
    quantity: overrides.quantity ?? new Prisma.Decimal(10),
    absQuantity: overrides.absQuantity ?? new Prisma.Decimal(10),
    price: overrides.price ?? new Prisma.Decimal(211.8),
    currency: overrides.currency ?? 'USD',
    grossAmount: overrides.grossAmount ?? new Prisma.Decimal(-2118),
    commission: overrides.commission ?? new Prisma.Decimal(-0.33928725),
    netAmount: overrides.netAmount ?? new Prisma.Decimal(-2118.33928725),
    side: overrides.side ?? 'BUY',
    isTrade: overrides.isTrade ?? true,
    isExternalCashFlow: overrides.isExternalCashFlow ?? false,
    isIncome: overrides.isIncome ?? false,
    isTaxOrFee: overrides.isTaxOrFee ?? false,
    createdAt: overrides.createdAt ?? new Date('2026-06-10T10:13:58.000Z'),
  };
}

describe('deduplicateDashboardEvents', () => {
  it('deduplicates the same IBKR trade imported from CSV and Email PDF', () => {
    const result = deduplicateDashboardEvents([
      createEvent({
        id: 'email_pdf',
        importFileId: 'email_import',
        source: 'IBKR_EMAIL_PDF',
        sourceFileName: 'DailyTradeReport.20260527.pdf',
        accountId: 'U***66165',
        rawRowIndex: 1,
        rawData: {
          tradeDateTime: '2026-05-27 09:42:11',
        },
        commission: new Prisma.Decimal(-0.34),
        netAmount: new Prisma.Decimal(-2118.34),
        createdAt: new Date('2026-06-10T10:25:49.000Z'),
      }),
      createEvent({
        id: 'csv',
        importFileId: 'csv_import',
        source: 'IBKR_CSV',
        sourceFileName: 'U18666165_20250820_20260528.csv',
        accountId: 'U18666165',
        rawRowIndex: 273,
        rawData: {
          '日期/时间': '2026-05-27, 09:42:11',
        },
        createdAt: new Date('2026-06-10T10:13:58.000Z'),
      }),
    ]);

    expect(result.events).toHaveLength(1);
    expect(result.events[0].id).toBe('csv');
    expect(result.warnings[0]).toContain('跨来源重复交易');
  });

  it('keeps same-day same-price trades when execution times differ', () => {
    const result = deduplicateDashboardEvents([
      createEvent({
        id: 'first',
        rawData: { '日期/时间': '2026-05-27, 09:42:11' },
      }),
      createEvent({
        id: 'second',
        importFileId: 'import_2',
        rawData: { '日期/时间': '2026-05-27, 09:45:11' },
      }),
    ]);

    expect(result.events.map((event) => event.id)).toEqual(['first', 'second']);
    expect(result.warnings).toEqual([]);
  });
});
