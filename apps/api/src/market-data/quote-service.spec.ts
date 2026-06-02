import Decimal from 'decimal.js';
import { EastMoneyProvider } from './eastmoney-provider';
import { QuoteCacheService } from './quote-cache.service';
import { QuoteService } from './quote-service';

function createEastMoneyProviderMock(
  getQuotes: EastMoneyProvider['getQuotes'],
): EastMoneyProvider {
  return { getQuotes } as EastMoneyProvider;
}

function createQuoteCacheMock(overrides: Partial<QuoteCacheService> = {}) {
  return {
    saveSnapshots: jest.fn(async () => undefined),
    getLatestQuotes: jest.fn(async () => new Map()),
    ...overrides,
  } as unknown as QuoteCacheService & {
    saveSnapshots: jest.Mock;
    getLatestQuotes: jest.Mock;
  };
}

describe('QuoteService', () => {
  it('saves a quote snapshot after a successful EastMoney quote request', async () => {
    const eastMoneyProvider = createEastMoneyProviderMock(async () => ({
      '105:NVDA': {
        symbol: 'NVDA',
        latestPrice: 150,
        currency: 'USD',
        name: 'NVIDIA Corporation',
      },
    }));
    const quoteCache = createQuoteCacheMock();
    const service = new QuoteService(eastMoneyProvider, quoteCache);

    const result = await service.getCurrentQuotes(['NVDA']);

    expect(result.quotesBySymbol.get('NVDA')).toMatchObject({
      symbol: 'NVDA',
      providerSymbol: '105:NVDA',
      name: 'NVIDIA Corporation',
      currency: 'USD',
      source: 'LIVE',
    });
    expect(result.quotesBySymbol.get('NVDA')?.price.toNumber()).toBe(150);
    expect(quoteCache.saveSnapshots).toHaveBeenCalledWith([
      expect.objectContaining({
        quote: expect.objectContaining({ symbol: 'NVDA', source: 'LIVE' }),
        rawData: expect.objectContaining({ name: 'NVIDIA Corporation' }),
      }),
    ]);
  });

  it('retries each symbol after a failed batch request', async () => {
    const getQuotes = jest
      .fn<ReturnType<EastMoneyProvider['getQuotes']>, Parameters<EastMoneyProvider['getQuotes']>>()
      .mockRejectedValueOnce(new Error('network unavailable'))
      .mockResolvedValueOnce({
        '105:NVDA': {
          symbol: 'NVDA',
          latestPrice: 150,
          currency: 'USD',
          name: 'NVIDIA Corporation',
        },
      });
    const eastMoneyProvider = createEastMoneyProviderMock(getQuotes);
    const quoteCache = createQuoteCacheMock();
    const service = new QuoteService(eastMoneyProvider, quoteCache);

    const result = await service.getCurrentQuotes(['NVDA']);

    expect(getQuotes).toHaveBeenCalledTimes(2);
    expect(result.quotesBySymbol.get('NVDA')?.price.toNumber()).toBe(150);
    expect(result.warnings).toContain('批量行情请求失败，已按单个股票重试。');
  });

  it('keeps the actual EastMoney market in the saved provider symbol', async () => {
    const eastMoneyProvider = createEastMoneyProviderMock(async () => ({
      '105:TSM': {
        symbol: 'TSM',
        latestPrice: 404.52,
        currency: 'USD',
        name: '台积电',
        market: 106,
      },
    }));
    const quoteCache = createQuoteCacheMock();
    const service = new QuoteService(eastMoneyProvider, quoteCache);

    const result = await service.getCurrentQuotes(['TSM']);

    expect(result.quotesBySymbol.get('TSM')).toMatchObject({
      providerSymbol: '106:TSM',
      currency: 'USD',
    });
  });

  it('uses live BRK_B quotes for all supported Berkshire B symbol variants', async () => {
    const getQuotes = jest
      .fn<ReturnType<EastMoneyProvider['getQuotes']>, Parameters<EastMoneyProvider['getQuotes']>>()
      .mockResolvedValue({
        '106:BRK_B': {
          symbol: 'BRK_B',
          latestPrice: 470.75,
          currency: 'USD',
          name: 'Berkshire Hathaway B',
          market: 106,
          rawData: { source: 'TENCENT_QUOTE' },
        },
      });
    const eastMoneyProvider = createEastMoneyProviderMock(getQuotes);
    const quoteCache = createQuoteCacheMock();
    const service = new QuoteService(eastMoneyProvider, quoteCache);

    const result = await service.getCurrentQuotes(['BRK B', 'BRKB', 'BRK.B', 'BRK-B']);

    expect(getQuotes).toHaveBeenCalledWith([
      expect.objectContaining({
        providerSymbol: 'BRK_B',
        providerKey: '106:BRK_B',
      }),
    ]);
    for (const symbol of ['BRK B', 'BRKB', 'BRK.B', 'BRK-B']) {
      expect(result.quotesBySymbol.get(symbol)).toMatchObject({
        symbol,
        providerSymbol: '106:BRK_B',
        source: 'LIVE',
        currency: 'USD',
      });
      expect(result.quotesBySymbol.get(symbol)?.price.toNumber()).toBe(470.75);
    }
    expect(quoteCache.saveSnapshots).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          quote: expect.objectContaining({
            symbol: 'BRK B',
            providerSymbol: '106:BRK_B',
            source: 'LIVE',
          }),
          rawData: expect.objectContaining({
            rawData: expect.objectContaining({ source: 'TENCENT_QUOTE' }),
          }),
        }),
      ]),
    );
    expect(quoteCache.getLatestQuotes).not.toHaveBeenCalled();
  });

  it('falls back to the latest cached quote when live data has no usable price', async () => {
    const cachedAt = new Date('2026-05-15T12:00:00.000Z');
    const eastMoneyProvider = createEastMoneyProviderMock(async () => ({
      '105:NVDA': {
        symbol: 'NVDA',
        latestPrice: 0,
        currency: 'USD',
      },
    }));
    const quoteCache = createQuoteCacheMock({
      getLatestQuotes: jest.fn(async () =>
        new Map([
          [
            'NVDA',
            {
              symbol: 'NVDA',
              providerSymbol: 'NVDA',
              name: 'NVIDIA Corporation',
              price: new Decimal(149),
              currency: 'USD',
              provider: 'EASTMONEY' as const,
              source: 'CACHE' as const,
              fetchedAt: cachedAt,
            },
          ],
        ]),
      ),
    });
    const service = new QuoteService(eastMoneyProvider, quoteCache);

    const result = await service.getCurrentQuotes(['NVDA']);

    expect(result.quotesBySymbol.get('NVDA')).toMatchObject({
      symbol: 'NVDA',
      source: 'CACHE',
      fetchedAt: cachedAt,
    });
    expect(result.quotesBySymbol.get('NVDA')?.price.toNumber()).toBe(149);
    expect(result.warnings.some((warning) => warning.includes('NVDA'))).toBe(
      true,
    );
  });

  it('falls back to legacy cache when EastMoney does not support a symbol', async () => {
    const cachedAt = new Date('2026-05-15T12:00:00.000Z');
    const eastMoneyProvider = createEastMoneyProviderMock(async () => ({}));
    const quoteCache = createQuoteCacheMock({
      getLatestQuotes: jest.fn(async () =>
        new Map([
          [
            'BRK B',
            {
              symbol: 'BRK B',
              providerSymbol: 'BRK-B',
              name: 'Berkshire Hathaway Inc.',
              price: new Decimal(486.38),
              currency: 'USD',
              provider: 'EASTMONEY' as const,
              source: 'CACHE' as const,
              fetchedAt: cachedAt,
            },
          ],
        ]),
      ),
    });
    const service = new QuoteService(eastMoneyProvider, quoteCache);

    const result = await service.getCurrentQuotes(['BRK B']);

    expect(result.quotesBySymbol.get('BRK B')).toMatchObject({
      source: 'CACHE',
      providerSymbol: 'BRK-B',
    });
    expect(result.quotesBySymbol.get('BRK B')?.price.toNumber()).toBe(486.38);
  });
});
