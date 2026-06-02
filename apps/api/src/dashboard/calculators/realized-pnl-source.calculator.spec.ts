import Decimal from 'decimal.js';
import {
  DashboardEventRow,
  PositionCostResult,
} from './dashboard-calculator.types';
import { calculateRealizedPnlSource } from './realized-pnl-source.calculator';

function createTrade(
  overrides: Partial<DashboardEventRow>,
): DashboardEventRow {
  return {
    eventType: overrides.eventType ?? 'TRADE_BUY',
    symbol: overrides.symbol ?? 'ORCL',
    isTrade: overrides.isTrade ?? true,
    rawData: overrides.rawData ?? {},
  } as DashboardEventRow;
}

function createPositionCost(): PositionCostResult {
  return {
    positions: [],
    totalRemainingCost: new Decimal(0),
    totalRealizedPnl: new Decimal(0),
    warnings: [],
  };
}

describe('calculateRealizedPnlSource', () => {
  it('includes IBKR realized PnL from buy-to-cover trade rows', () => {
    const result = calculateRealizedPnlSource(
      [
        createTrade({
          eventType: 'TRADE_SELL',
          rawData: { '已实现的损益': '26.82' },
        }),
        createTrade({
          eventType: 'TRADE_BUY',
          rawData: { '已实现的损益': '-18.39' },
        }),
      ],
      createPositionCost(),
    );

    expect(result.source).toBe('IBKR_RAW_DATA');
    expect(result.realizedPnl.toNumber()).toBeCloseTo(8.43, 6);
    expect(result.bySymbol.get('ORCL')?.toNumber()).toBeCloseTo(8.43, 6);
  });
});
