import { PortfolioTradingBehaviorService } from './portfolio-trading-behavior.service';
import { PortfolioTransactionsService } from './portfolio-transactions.service';

describe('PortfolioTradingBehaviorService', () => {
  it('aggregates BUY and SELL transaction behavior without FIFO fallback', async () => {
    const portfolioTransactionsService = {
      listTransactionItems: jest.fn().mockResolvedValue({
        warnings: [],
        transactions: [
          {
            id: 'buy-1',
            date: '2026-01-10',
            symbol: 'MSFT',
            name: 'Microsoft',
            side: 'BUY',
            quantity: 10,
            price: 100,
            amount: -1001,
            commission: -1,
            realizedPnl: null,
            currency: 'USD',
            source: 'IBKR_CSV',
            importBatchId: 'import-1',
            sourceFileName: 'sample.csv',
            sourceSection: 'Trades',
            rawRowIndex: 1,
            accountId: 'U123',
            description: 'Microsoft',
            ibkrType: 'Buy',
            eventType: 'TRADE_BUY',
            rawRecord: {},
          },
          {
            id: 'sell-1',
            date: '2026-01-20',
            symbol: 'MSFT',
            name: 'Microsoft',
            side: 'SELL',
            quantity: 4,
            price: 125,
            amount: 499,
            commission: -1,
            realizedPnl: 96.5,
            currency: 'USD',
            source: 'IBKR_CSV',
            importBatchId: 'import-1',
            sourceFileName: 'sample.csv',
            sourceSection: 'Trades',
            rawRowIndex: 2,
            accountId: 'U123',
            description: 'Microsoft',
            ibkrType: 'Sell',
            eventType: 'TRADE_SELL',
            rawRecord: {},
          },
          {
            id: 'sell-2',
            date: '2026-02-02',
            symbol: 'NVDA',
            name: 'NVIDIA',
            side: 'SELL',
            quantity: 1,
            price: 90,
            amount: 89,
            commission: -1,
            realizedPnl: null,
            currency: 'USD',
            source: 'IBKR_CSV',
            importBatchId: 'import-1',
            sourceFileName: 'sample.csv',
            sourceSection: 'Trades',
            rawRowIndex: 3,
            accountId: 'U123',
            description: 'NVIDIA',
            ibkrType: 'Sell',
            eventType: 'TRADE_SELL',
            rawRecord: {},
          },
        ],
      }),
    };
    const service = new PortfolioTradingBehaviorService(
      portfolioTransactionsService as unknown as PortfolioTransactionsService,
    );

    const result = await service.getTradingBehavior({
      range: 'ALL',
      symbol: 'MSFT',
    });

    expect(portfolioTransactionsService.listTransactionItems).toHaveBeenCalledWith(
      expect.objectContaining({ symbol: 'MSFT' }),
    );
    expect(result.summary).toMatchObject({
      totalTrades: 3,
      buyTrades: 1,
      sellTrades: 2,
      tradedSymbolCount: 2,
      totalCommission: 3,
      realizedPnl: 96.5,
      winRate: 1,
    });
    expect(result.summary.avgTradeAmount).toBeCloseTo(529.666667);
    expect(result.monthlyTradeCounts).toEqual([
      { month: '2026-01', buyCount: 1, sellCount: 1, totalCount: 2 },
      { month: '2026-02', buyCount: 0, sellCount: 1, totalCount: 1 },
    ]);
    expect(result.monthlyTradeAmounts).toEqual([
      {
        month: '2026-01',
        buyAmount: 1001,
        sellAmount: 499,
        netBuyAmount: 502,
      },
      { month: '2026-02', buyAmount: 0, sellAmount: 89, netBuyAmount: -89 },
    ]);
    expect(result.symbolStats[0]).toMatchObject({
      symbol: 'MSFT',
      tradeCount: 2,
      buyCount: 1,
      sellCount: 1,
      buyAmount: 1001,
      sellAmount: 499,
      commission: 2,
      realizedPnl: 96.5,
    });
    expect(result.warnings.join('\n')).toContain(
      'SELL trades are missing IBKR realizedPnl',
    );
  });

  it('returns null winRate and avgTradeAmount when there are no trades', async () => {
    const portfolioTransactionsService = {
      listTransactionItems: jest.fn().mockResolvedValue({
        warnings: [],
        transactions: [],
      }),
    };
    const service = new PortfolioTradingBehaviorService(
      portfolioTransactionsService as unknown as PortfolioTransactionsService,
    );

    const result = await service.getTradingBehavior({ range: 'ALL' });

    expect(result.summary.winRate).toBeNull();
    expect(result.summary.avgTradeAmount).toBeNull();
    expect(result.symbolStats).toEqual([]);
    expect(result.realizedPnlContributions).toEqual([]);
  });
});
