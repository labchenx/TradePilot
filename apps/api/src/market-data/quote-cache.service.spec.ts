import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { QuoteCacheService } from './quote-cache.service';

function createPrismaMock() {
  return {
    marketQuoteSnapshot: {
      findFirst: jest.fn(),
    },
    priceHistory: {
      findFirst: jest.fn(),
    },
  } as unknown as PrismaService & {
    marketQuoteSnapshot: { findFirst: jest.Mock };
    priceHistory: { findFirst: jest.Mock };
  };
}

describe('QuoteCacheService', () => {
  it('falls back to latest price history when quote snapshots are missing', async () => {
    const prisma = createPrismaMock();
    const historyDate = new Date('2026-05-29T00:00:00.000Z');
    prisma.marketQuoteSnapshot.findFirst.mockResolvedValue(null);
    prisma.priceHistory.findFirst.mockResolvedValueOnce({
      symbol: 'NVDA',
      providerSymbol: '105:NVDA',
      close: new Prisma.Decimal('211.14'),
      adjustedClose: new Prisma.Decimal('211.14'),
      currency: 'USD',
      date: historyDate,
    });
    const service = new QuoteCacheService(prisma);

    const result = await service.getLatestQuotes([
      { symbol: 'NVDA', providerSymbol: '105:NVDA' },
    ]);

    expect(result.get('NVDA')).toMatchObject({
      symbol: 'NVDA',
      providerSymbol: '105:NVDA',
      currency: 'USD',
      provider: 'EASTMONEY',
      source: 'CACHE',
      fetchedAt: historyDate,
    });
    expect(result.get('NVDA')?.price.toNumber()).toBe(211.14);
  });

  it('keeps quote snapshots before using historical prices', async () => {
    const prisma = createPrismaMock();
    const snapshotDate = new Date('2026-06-01T12:00:00.000Z');
    prisma.marketQuoteSnapshot.findFirst.mockResolvedValueOnce({
      symbol: 'NVDA',
      providerSymbol: '105:NVDA',
      name: 'NVIDIA Corporation',
      price: new Prisma.Decimal('220.5'),
      currency: 'USD',
      provider: 'EASTMONEY',
      fetchedAt: snapshotDate,
    });
    const service = new QuoteCacheService(prisma);

    const result = await service.getLatestQuotes([
      { symbol: 'NVDA', providerSymbol: '105:NVDA' },
    ]);

    expect(result.get('NVDA')?.price.toNumber()).toBe(220.5);
    expect(prisma.priceHistory.findFirst).not.toHaveBeenCalled();
  });
});
