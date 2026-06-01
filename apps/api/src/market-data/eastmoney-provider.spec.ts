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
