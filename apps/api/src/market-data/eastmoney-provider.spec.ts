import { EastMoneyProvider } from './eastmoney-provider';
import { EastMoneyMarket } from './symbol-normalizer';

function mockTextResponse(text: string): Response {
  return {
    ok: true,
    status: 200,
    text: jest.fn(async () => text),
  } as unknown as Response;
}

function mockJsonResponse(payload: unknown): Response {
  return {
    ok: true,
    status: 200,
    json: jest.fn(async () => payload),
  } as unknown as Response;
}

describe('EastMoneyProvider Sina/Tencent adapters', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('falls back to Tencent US quotes when Sina has no usable BRK_B quote data', async () => {
    const fetchMock = jest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce(
        mockTextResponse(
          'var hq_str_gb_brk_b="";\nvar hq_str_gb_brk.b="";\nvar hq_str_gb_brkb="BRKB,0.0000,0.00,2019-09-24 09:30:43";',
        ),
      )
      .mockResolvedValueOnce(
        mockTextResponse(
          'v_usBRK.B="200~Berkshire Hathaway B~BRK.B.N~470.75~474.48~473.05~1439453~0~0~0~0~0~0~0~0~0~0~0~0~0~0~0~0~0~0~0~0~0~0~~2026-06-01 11:08:00~-3.73~-0.79~473.29~470.34~USD";',
        ),
      );
    const provider = new EastMoneyProvider();

    const quotes = await provider.getQuotes([
      {
        providerSymbol: 'BRK_B',
        market: EastMoneyMarket.US_NYSE,
        providerKey: '106:BRK_B',
      },
    ]);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[1][0])).toContain('q=usBRK.B');
    expect(quotes['106:BRK_B']).toMatchObject({
      symbol: 'BRK_B',
      latestPrice: 470.75,
      currency: 'USD',
      name: 'Berkshire Hathaway B',
      market: EastMoneyMarket.US_NYSE,
      rawData: expect.objectContaining({ source: 'TENCENT_QUOTE' }),
    });
  });

  it('does not create a quote when Tencent US quote data is invalid', async () => {
    const fetchMock = jest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce(mockTextResponse('var hq_str_gb_brk_b="";'))
      .mockResolvedValueOnce(
        mockTextResponse(
          'v_usBRK.B="200~Berkshire Hathaway B~BRK.B.N~0.00~474.48~473.05~USD";',
        ),
      );
    const provider = new EastMoneyProvider();

    const quotes = await provider.getQuotes([
      {
        providerSymbol: 'BRK_B',
        market: EastMoneyMarket.US_NYSE,
        providerKey: '106:BRK_B',
      },
    ]);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(quotes).toEqual({});
  });

  it('does not request Tencent when Sina resolves a US quote', async () => {
    const fetchMock = jest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce(
        mockTextResponse(
          'var hq_str_gb_aapl="Apple Inc,210.50,1.10,0.53,2026-06-01 16:00:00";',
        ),
      );
    const provider = new EastMoneyProvider();

    const quotes = await provider.getQuotes([
      {
        providerSymbol: 'AAPL',
        market: EastMoneyMarket.US,
        providerKey: '105:AAPL',
      },
    ]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(quotes['105:AAPL']).toMatchObject({
      symbol: 'AAPL',
      latestPrice: 210.5,
      currency: 'USD',
      name: 'Apple Inc',
    });
  });

  it('loads US daily history from Tencent when Sina has no usable US K-line rows', async () => {
    const fetchMock = jest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce(
        mockTextResponse('v_usWMT="200~Walmart~WMT.N~114.50";'),
      )
      .mockResolvedValueOnce(
        mockTextResponse(
          'kline_dayqfq={"code":0,"msg":"","data":{"usWMT.N":{"day":[["2024-12-30","90.00","91.20","92.00","89.50","100"],["2024-12-31","91.20","92.50","93.00","91.00","100"],["2025-01-31","95.00","96.80","97.00","94.50","100"],["2025-02-03","97.00","98.10","99.00","96.50","100"]]}}};',
        ),
      );
    const provider = new EastMoneyProvider();

    const prices = await provider.getDailyPrices(
      {
        providerSymbol: 'WMT',
        market: EastMoneyMarket.US,
        providerKey: '105:WMT',
      },
      new Date('2024-12-01T00:00:00.000Z'),
      new Date('2025-02-01T00:00:00.000Z'),
    );

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[1][0])).toContain('param=usWMT.N');
    expect(prices.map((price) => price.date.toISOString().slice(0, 10))).toEqual([
      '2024-12-30',
      '2024-12-31',
      '2025-01-31',
    ]);
    expect(prices.map((price) => price.close)).toEqual([91.2, 92.5, 96.8]);
    expect(prices.every((price) => price.currency === 'USD')).toBe(true);
  });

  it('does not treat a non-array Sina K-line response as valid history', async () => {
    const fetchMock = jest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce(mockJsonResponse({ __ERROR: 3 }));
    const provider = new EastMoneyProvider();

    const prices = await provider.getDailyPrices(
      {
        providerSymbol: '600519',
        market: EastMoneyMarket.Shanghai,
        providerKey: '1:600519',
      },
      new Date('2025-01-01T00:00:00.000Z'),
      new Date('2025-02-01T00:00:00.000Z'),
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(prices).toEqual([]);
  });
});
