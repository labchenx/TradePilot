import { DataGapService } from './data-gap.service';

function createPrismaMock() {
  return {
    emailMessageRecord: {
      findMany: jest.fn(),
    },
    importFile: {
      findMany: jest.fn(),
    },
    transactionEvent: {
      findMany: jest.fn(),
    },
  };
}

describe('DataGapService', () => {
  it('flags a weekday with no email, import, or trade when active data exists on both sides', async () => {
    const prisma = createPrismaMock();
    prisma.emailMessageRecord.findMany.mockResolvedValue([
      { receivedAt: new Date('2026-06-01T12:00:00.000Z') },
    ]);
    prisma.importFile.findMany.mockResolvedValue([]);
    prisma.transactionEvent.findMany.mockResolvedValue([
      { tradeDate: new Date('2026-06-03T00:00:00.000Z') },
    ]);

    const service = new DataGapService(prisma as never);
    const result = await service.checkGaps('user_1', 30);

    expect(result.gaps).toEqual([
      {
        date: '2026-06-02',
        reasons: ['无邮件同步记录', '无导入记录', '无交易事件'],
        hasPrecedingData: true,
        hasFollowingData: true,
      },
    ]);
    expect(result.tradingDaysChecked).toBe(3);
    expect(result.status).toBe('HAS_GAPS');
  });

  it('does not flag email-only activity when there are no trade events yet', async () => {
    const prisma = createPrismaMock();
    prisma.emailMessageRecord.findMany.mockResolvedValue([
      { receivedAt: new Date('2026-05-19T12:00:00.000Z') },
      { receivedAt: new Date('2026-05-22T12:00:00.000Z') },
    ]);
    prisma.importFile.findMany.mockResolvedValue([]);
    prisma.transactionEvent.findMany.mockResolvedValue([]);

    const service = new DataGapService(prisma as never);
    const result = await service.checkGaps('user_1', 30);

    expect(result.gaps).toEqual([]);
    expect(result.tradingDaysChecked).toBe(0);
    expect(result.status).toBe('NO_TRADE_DATA');
    expect(result.checkedRange).toEqual({
      start: '2026-05-19',
      end: '2026-05-22',
    });
  });

  it('does not mark dates covered by a confirmed import file range as missing', async () => {
    const prisma = createPrismaMock();
    prisma.emailMessageRecord.findMany.mockResolvedValue([]);
    prisma.importFile.findMany.mockResolvedValue([
      {
        periodStart: new Date('2026-06-01T00:00:00.000Z'),
        periodEnd: new Date('2026-06-03T00:00:00.000Z'),
        createdAt: new Date('2026-06-03T12:00:00.000Z'),
      },
    ]);
    prisma.transactionEvent.findMany.mockResolvedValue([]);

    const service = new DataGapService(prisma as never);
    const result = await service.checkGaps('user_1', 30);

    expect(result.gaps).toEqual([]);
    expect(result.checkedRange).toEqual({
      start: '2026-06-01',
      end: '2026-06-03',
    });
    expect(result.status).toBe('NO_TRADE_DATA');
  });
});
