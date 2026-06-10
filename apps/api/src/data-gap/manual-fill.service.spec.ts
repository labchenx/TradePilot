import { ConflictException } from '@nestjs/common';
import { ManualFillService } from './manual-fill.service';

describe('ManualFillService', () => {
  const importConfirmService = {
    confirm: jest.fn(),
  };
  const portfolioAnalyticsService = {
    getAnalytics: jest.fn(async () => ({ warnings: [] })),
  };
  const prisma = {
    transactionEvent: {
      findUnique: jest.fn(async () => ({ id: 'event_1' })),
    },
  };
  const service = new ManualFillService(
    importConfirmService as never,
    portfolioAnalyticsService as never,
    prisma as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('normalizes commission as a cash outflow and builds deterministic sourceHash', async () => {
    importConfirmService.confirm.mockResolvedValue({
      importJobId: 'job_1',
      summary: {
        totalRecords: 1,
        insertedRecords: 1,
        duplicateRecords: 0,
        updatedRecords: 0,
        failedRecords: 0,
      },
      records: [{ tempId: 'manual', recordType: 'TRADE', status: 'SUCCESS' }],
      warnings: [],
    });

    await service.fill('user_1', {
      symbol: 'AMD',
      tradeDate: '2026-06-03',
      tradeTime: '09:30',
      side: 'BUY',
      quantity: 10,
      price: 150,
      commission: 1,
      currency: 'USD',
      note: 'first fill',
    });
    await service.fill('user_1', {
      symbol: 'AMD',
      tradeDate: '2026-06-03',
      tradeTime: '09:30',
      side: 'BUY',
      quantity: 10,
      price: 150,
      commission: 1,
      currency: 'USD',
      note: 'first fill',
    });

    const firstRecord = importConfirmService.confirm.mock.calls[0][2][0];
    const secondRecord = importConfirmService.confirm.mock.calls[1][2][0];
    expect(firstRecord.sourceHash).toBe(secondRecord.sourceHash);
    expect(firstRecord.data.grossAmount).toBe(-1500);
    expect(firstRecord.data.commission).toBe(-1);
    expect(firstRecord.data.netAmount).toBe(-1501);
    expect(firstRecord.data.rawData.cashAdjustmentMode).toBe('ADJUST_CASH');
  });

  it('surfaces existing sourceHash duplicates as a conflict', async () => {
    importConfirmService.confirm.mockResolvedValue({
      importJobId: 'job_1',
      summary: {
        totalRecords: 1,
        insertedRecords: 0,
        duplicateRecords: 1,
        updatedRecords: 0,
        failedRecords: 0,
      },
      records: [{ tempId: 'manual', recordType: 'TRADE', status: 'DUPLICATE' }],
      warnings: [],
    });

    await expect(
      service.fill('user_1', {
        symbol: 'AMD',
        tradeDate: '2026-06-03',
        side: 'BUY',
        quantity: 10,
        price: 150,
        currency: 'USD',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
