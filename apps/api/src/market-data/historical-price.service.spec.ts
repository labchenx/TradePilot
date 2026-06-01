import { Prisma } from '@prisma/client';
import { EastMoneyProvider } from './eastmoney-provider';
import { HistoricalPriceService } from './historical-price.service';

function createPrismaMock() {
  return {
    priceHistory: {
      findFirst: jest.fn(),
      upsert: jest.fn(async () => undefined),
    },
  };
}

function createProviderMock(
  getDailyPrices: EastMoneyProvider['getDailyPrices'],
): EastMoneyProvider {
  return { getDailyPrices } as EastMoneyProvider;
}

describe('HistoricalPriceService', () => {
  it('falls back to the NYSE EastMoney market when the default US market has no daily prices', async () => {
    const date = new Date('2026-05-28T00:00:00.000Z');
    const prisma = createPrismaMock();
    prisma.priceHistory.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        symbol: 'MCD',
        providerSymbol: '106:MCD',
        date,
        close: new Prisma.Decimal(277.97),
        adjustedClose: new Prisma.Decimal(277.97),
        currency: 'USD',
        source: 'EASTMONEY',
      });
    const getDailyPrices = jest
      .fn<
        ReturnType<EastMoneyProvider['getDailyPrices']>,
        Parameters<EastMoneyProvider['getDailyPrices']>
      >()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          date,
          close: 277.97,
          adjustedClose: 277.97,
          currency: 'USD',
        },
      ]);
    const service = new HistoricalPriceService(
      prisma as never,
      createProviderMock(getDailyPrices),
    );

    const result = await service.getMonthEndClosePrice(
      'MCD',
      new Date('2026-05-01T00:00:00.000Z'),
      new Date('2026-05-31T00:00:00.000Z'),
    );

    expect(getDailyPrices).toHaveBeenCalledTimes(2);
    expect(getDailyPrices.mock.calls.map(([symbol]) => symbol.providerKey)).toEqual([
      '105:MCD',
      '106:MCD',
    ]);
    expect(prisma.priceHistory.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          symbol: 'MCD',
          providerSymbol: '106:MCD',
          source: 'EASTMONEY',
        }),
      }),
    );
    expect(result).toMatchObject({
      symbol: 'MCD',
      providerSymbol: '106:MCD',
      source: 'EASTMONEY',
      currency: 'USD',
      warnings: [],
    });
    expect(result.close?.toNumber()).toBe(277.97);
  });
});
