import Decimal from 'decimal.js';
import { QuoteCacheService } from './quote-cache.service';
import { QuoteService } from './quote-service';
import { YahooProvider } from './yahoo-provider';

function createYahooProviderMock(
  getQuotes: YahooProvider['getQuotes'],
): YahooProvider {
  return { getQuotes } as YahooProvider;
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
  it('saves a quote snapshot after a successful Yahoo quote request', async () => {
    const yahooProvider = createYahooProviderMock(async () => ({
      NVDA: {
        symbol: 'NVDA',
        regularMarketPrice: 150,
        currency: 'USD',
        shortName: 'NVIDIA Corporation',
      },
    }));
    const quoteCache = createQuoteCacheMock();
    const service = new QuoteService(yahooProvider, quoteCache);

    const result = await service.getCurrentQuotes(['NVDA']);

    expect(result.quotesBySymbol.get('NVDA')).toMatchObject({
      symbol: 'NVDA',
      providerSymbol: 'NVDA',
      name: 'NVIDIA Corporation',
      currency: 'USD',
      source: 'LIVE',
    });
    expect(result.quotesBySymbol.get('NVDA')?.price.toNumber()).toBe(150);
    expect(quoteCache.saveSnapshots).toHaveBeenCalledWith([
      expect.objectContaining({
        quote: expect.objectContaining({ symbol: 'NVDA', source: 'LIVE' }),
        rawData: expect.objectContaining({ shortName: 'NVIDIA Corporation' }),
      }),
    ]);
  });

  it('falls back to the latest cached quote when Yahoo has no usable price', async () => {
    const cachedAt = new Date('2026-05-15T12:00:00.000Z');
    const yahooProvider = createYahooProviderMock(async () => ({
      NVDA: {
        symbol: 'NVDA',
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
              provider: 'YAHOO_FINANCE' as const,
              source: 'CACHE' as const,
              fetchedAt: cachedAt,
            },
          ],
        ]),
      ),
    });
    const service = new QuoteService(yahooProvider, quoteCache);

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
});
