import Decimal from 'decimal.js';
import { PortfolioPositionsService } from './portfolio-positions.service';

function createTradeEvent(overrides: Record<string, unknown>) {
  return {
    id: 'event-1',
    userId: 'default_user',
    importFileId: 'import-1',
    source: 'IBKR_CSV',
    sourceEventHash: null,
    sourceFileName: 'sample.csv',
    sourceSection: 'Trades',
    rawRowIndex: 1,
    rawData: {},
    tradeDate: new Date('2026-01-01T00:00:00.000Z'),
    accountId: 'U123',
    description: 'MSFT buy',
    ibkrType: 'Buy',
    eventType: 'TRADE_BUY',
    symbol: 'MSFT',
    quantity: new Decimal(10),
    absQuantity: new Decimal(10),
    price: new Decimal(100),
    currency: 'USD',
    grossAmount: new Decimal(-1000),
    commission: new Decimal(0),
    netAmount: new Decimal(-1000),
    side: 'BUY',
    isTrade: true,
    isExternalCashFlow: false,
    isIncome: false,
    isTaxOrFee: false,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

describe('PortfolioPositionsService', () => {
  it('builds holdings from transaction events and quote prices', async () => {
    const prisma = {
      transactionEvent: {
        findMany: jest.fn().mockResolvedValue([createTradeEvent({})]),
      },
    };
    const quoteService = {
      getCurrentQuotes: jest.fn().mockResolvedValue({
        quotesBySymbol: new Map([
          [
            'MSFT',
            {
              symbol: 'MSFT',
              providerSymbol: 'MSFT',
              name: 'Microsoft Corporation',
              price: new Decimal(125),
              currency: 'USD',
              provider: 'EASTMONEY',
              source: 'LIVE',
              fetchedAt: new Date('2026-01-02T00:00:00.000Z'),
            },
          ],
        ]),
        warnings: [],
      }),
    };
    const service = new PortfolioPositionsService(
      prisma as never,
      quoteService as never,
    );

    const result = await service.getPositions();

    expect(result.summary).toMatchObject({
      numberOfHoldings: 1,
      totalMarketValue: 1250,
      totalCost: 1000,
      unrealizedPnl: 250,
      unrealizedReturnRate: 0.25,
    });
    expect(result.holdings[0]).toMatchObject({
      symbol: 'MSFT',
      name: 'Microsoft Corporation',
      quantity: 10,
      avgCost: 100,
      marketPrice: 125,
      costBasis: 1000,
      marketValue: 1250,
      unrealizedPnl: 250,
      unrealizedReturnRate: 0.25,
      weight: 1,
    });
    expect(result.allocation).toEqual([
      {
        symbol: 'MSFT',
        marketValue: 1250,
        weight: 1,
      },
    ]);
    expect(result.pnlBySymbol).toEqual([
      {
        symbol: 'MSFT',
        unrealizedPnl: 250,
      },
    ]);
  });
});
