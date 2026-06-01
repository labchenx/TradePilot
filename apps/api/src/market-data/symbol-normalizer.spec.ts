import {
  EastMoneyMarket,
  getEastMoneyProviderSymbolCandidates,
  normalizeSymbolForEastMoney,
} from './symbol-normalizer';

describe('normalizeSymbolForEastMoney', () => {
  it.each([
    ['AAPL', EastMoneyMarket.US, 'AAPL'],
    ['SPY', EastMoneyMarket.US_ETF, 'SPY'],
    ['00700', EastMoneyMarket.HongKong, '00700'],
    ['600519', EastMoneyMarket.Shanghai, '600519'],
    ['000001', EastMoneyMarket.Shenzhen, '000001'],
    ['107:SPY', EastMoneyMarket.US_ETF, 'SPY'],
    ['106:TSM', EastMoneyMarket.US_NYSE, 'TSM'],
    ['BRK B', EastMoneyMarket.US_NYSE, 'BRK_B'],
    ['BRKB', EastMoneyMarket.US_NYSE, 'BRK_B'],
    ['BRK.B', EastMoneyMarket.US_NYSE, 'BRK_B'],
    ['BRK-B', EastMoneyMarket.US_NYSE, 'BRK_B'],
    ['106:BRKB', EastMoneyMarket.US_NYSE, 'BRK_B'],
  ])('maps %s to EastMoney market %s', (input, market, providerSymbol) => {
    expect(normalizeSymbolForEastMoney(input)).toEqual({
      providerSymbol,
      market,
      providerKey: `${market}:${providerSymbol}`,
    });
  });
});

describe('getEastMoneyProviderSymbolCandidates', () => {
  it('tries the NYSE market for plain US symbols whose default market has no history', () => {
    const candidates = getEastMoneyProviderSymbolCandidates(
      normalizeSymbolForEastMoney('MCD'),
    );

    expect(candidates.map((candidate) => candidate.providerKey)).toEqual([
      '105:MCD',
      '106:MCD',
      '107:MCD',
    ]);
  });

  it('keeps ETF symbols first when the normalizer already knows the ETF market', () => {
    const candidates = getEastMoneyProviderSymbolCandidates(
      normalizeSymbolForEastMoney('SPY'),
    );

    expect(candidates.map((candidate) => candidate.providerKey)).toEqual([
      '107:SPY',
      '105:SPY',
      '106:SPY',
    ]);
  });
});
