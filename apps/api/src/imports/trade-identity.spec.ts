import { createCrossSourceTradeFingerprint } from './trade-identity';

describe('createCrossSourceTradeFingerprint', () => {
  it('matches the same IBKR fill from CSV and Daily Trade Report PDF', () => {
    const csvFingerprint = createCrossSourceTradeFingerprint({
      accountId: 'U18666165',
      tradeDate: '2026-05-27',
      eventType: 'TRADE_BUY',
      symbol: 'NVDA',
      side: 'BUY',
      quantity: 10,
      absQuantity: 10,
      price: 211.8,
      currency: 'USD',
      rawData: {
        '日期/时间': '2026-05-27, 09:42:11',
      },
    });
    const emailPdfFingerprint = createCrossSourceTradeFingerprint({
      accountId: 'U***66165',
      tradeDate: '2026-05-27',
      eventType: 'TRADE_BUY',
      symbol: 'NVDA',
      side: 'BUY',
      quantity: 10,
      absQuantity: 10,
      price: 211.8,
      currency: 'USD',
      rawData: {
        tradeDateTime: '2026-05-27 09:42:11',
      },
    });

    expect(emailPdfFingerprint).toBe(csvFingerprint);
  });

  it('keeps different fill times separate even when date, symbol, quantity and price match', () => {
    const first = createCrossSourceTradeFingerprint({
      accountId: 'U18666165',
      tradeDate: '2026-05-27',
      eventType: 'TRADE_BUY',
      symbol: 'NVDA',
      side: 'BUY',
      absQuantity: 10,
      price: 211.8,
      currency: 'USD',
      rawData: { '日期/时间': '2026-05-27, 09:42:11' },
    });
    const second = createCrossSourceTradeFingerprint({
      accountId: 'U18666165',
      tradeDate: '2026-05-27',
      eventType: 'TRADE_BUY',
      symbol: 'NVDA',
      side: 'BUY',
      absQuantity: 10,
      price: 211.8,
      currency: 'USD',
      rawData: { '日期/时间': '2026-05-27, 09:45:11' },
    });

    expect(second).not.toBe(first);
  });
});
