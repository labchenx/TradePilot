import {
  createEmailPdfTradeSourceHash,
  parseIbkrPdfTrades,
} from './ibkr-pdf-trade-parser';

describe('parseIbkrPdfTrades', () => {
  it('parses tab-separated IBKR Daily Trade Report rows', () => {
    const text = [
      'Daily Trade Report',
      'Trades',
      'Acct ID\tSymbol\tTrade Date/Time\tSettle Date\tType\tQuantity\tPrice\tProceeds\tComm\tFee\tOrder Type\tCode\tCurrency',
      'U1234567\tAMD\t05/21/2026 09:31:22\t05/26/2026\tBUY\t10\t150.25\t-1502.50\t-1.00\t0\tLMT\tO\tUSD',
      'U1234567\tNVDA\t05/22/2026 10:01:00\t05/27/2026\tSELL\t2\t900.50\t1801.00\t-1.25\t0\tMKT\tC\tUSD',
    ].join('\n');

    const result = parseIbkrPdfTrades(text);

    expect(result.errors).toEqual([]);
    expect(result.trades).toHaveLength(2);
    expect(result.trades[0]).toMatchObject({
      accountId: 'U1234567',
      symbol: 'AMD',
      tradeDateTime: '2026-05-21 09:31:22',
      tradeDate: '2026-05-21',
      settleDate: '2026-05-26',
      side: 'BUY',
      quantity: 10,
      price: 150.25,
      proceeds: -1502.5,
      commission: -1,
      fee: 0,
      orderType: 'LMT',
      code: 'O',
      currency: 'USD',
    });
  });

  it('returns row-level errors when required fields are missing', () => {
    const text = [
      'Trades',
      'Acct ID\tSymbol\tTrade Date/Time\tSettle Date\tType\tQuantity\tPrice\tProceeds\tComm\tFee\tOrder Type\tCode\tCurrency',
      'U1234567\tAMD\t05/21/2026 09:31:22\t05/26/2026\tBUY\t10',
    ].join('\n');

    const result = parseIbkrPdfTrades(text);

    expect(result.trades).toHaveLength(0);
    expect(result.errors[0].message).toContain('Price');
  });

  it('parses masked account rows with punctuation from PDF text extraction', () => {
    const text = [
      'Daily Trade Report',
      'Trades',
      'Acct ID Symbol Trade Date/Time Settle Date Type Quantity Price Proceeds Comm Fee Order Type Code Currency',
      'U***66165 NVDA 2026-05-21, 10:17:58 2026-05-22 BUY 10 220.4 -2,204 -0.34 0 LMT O USD',
      'U***66165 NVDA 2026-05-21, 10:20:00 2026-05-22 BUY 5 220.2 -1,101 -0.35 0 LMT O USD',
    ].join('\n');

    const result = parseIbkrPdfTrades(text);

    expect(result.errors).toEqual([]);
    expect(result.trades).toHaveLength(2);
    expect(result.trades[0]).toMatchObject({
      accountId: 'U***66165',
      symbol: 'NVDA',
      tradeDateTime: '2026-05-21 10:17:58',
      tradeDate: '2026-05-21',
      settleDate: '2026-05-22',
      side: 'BUY',
      quantity: 10,
      price: 220.4,
      proceeds: -2204,
      commission: -0.34,
      fee: 0,
      orderType: 'LMT',
      code: 'O',
      currency: 'USD',
    });
  });

  it('does not treat BUY as currency when PDF rows omit the currency column', () => {
    const text = [
      'Daily Trade Report',
      'Trades',
      'Acct ID Symbol Trade Date/Time Settle Date Exchange Type Quantity Price Proceeds Comm Fee Order Type Code Currency',
      'U***66165 NVDA 2026-05-21, 10:17:58 2026-05-22 - BUY 10 220.4000 -2,204.00 -0.34 0.00 LMT O',
      'U***66165 NVDA 2026-05-21, 22:06:14 2026-05-26 - BUY 5 220.2000 -1,101.00 -0.35 0.00 LMT O',
    ].join('\n');

    const result = parseIbkrPdfTrades(text);

    expect(result.errors).toEqual([]);
    expect(result.trades).toHaveLength(2);
    expect(result.trades[0]).toMatchObject({
      exchange: '-',
      side: 'BUY',
      currency: 'USD',
      orderType: 'LMT',
      code: 'O',
    });
    expect(result.trades[1]).toMatchObject({
      side: 'BUY',
      currency: 'USD',
      orderType: 'LMT',
      code: 'O',
    });
  });

  it('does not treat BRK B class suffix as a BUY side token', () => {
    const text = [
      'Daily Trade Report',
      'Trades',
      'Acct ID Symbol Trade Date/Time Settle Date Type Quantity Price Proceeds Comm Fee Order Type Code Currency',
      'U***66165 BRK B 2026-06-15, 09:30:00 2026-06-16 SELL 4 489.40 1,957.20 -0.40 0.00 LMT C USD',
    ].join('\n');

    const result = parseIbkrPdfTrades(text);

    expect(result.errors).toEqual([]);
    expect(result.trades).toHaveLength(1);
    expect(result.trades[0]).toMatchObject({
      accountId: 'U***66165',
      symbol: 'BRK B',
      side: 'SELL',
      quantity: 4,
      price: 489.4,
      proceeds: 1957.2,
      commission: -0.4,
      fee: 0,
      currency: 'USD',
    });
  });

  it('creates stable source hashes from normalized trade fields', () => {
    const base = {
      accountId: 'U1234567',
      symbol: 'AMD',
      tradeDateTime: '2026-05-21 09:31:22',
      tradeDate: '2026-05-21',
      settleDate: '2026-05-26',
      side: 'BUY' as const,
      quantity: 10,
      price: 150.25,
      proceeds: -1502.5,
      commission: -1,
      fee: 0,
      currency: 'USD',
      orderType: 'LMT',
      code: 'O',
    };

    expect(createEmailPdfTradeSourceHash(base)).toEqual(
      createEmailPdfTradeSourceHash({ ...base }),
    );
    expect(createEmailPdfTradeSourceHash(base)).not.toEqual(
      createEmailPdfTradeSourceHash({ ...base, quantity: 11 }),
    );
  });
});
