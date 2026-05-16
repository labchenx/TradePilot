import { readFileSync } from 'fs';
import { resolve } from 'path';
import { parseIbkrCsv } from './ibkr-csv-parser';
import { detectIbkrTransactionHistoryCsv } from './parser-detector';

const projectRoot = resolve(__dirname, '../../../../../');

function readExampleCsv(filename: string) {
  return readFileSync(resolve(projectRoot, 'examples/ibkr', filename), 'utf8');
}

describe('IBKR CSV parser', () => {
  const firstCsv = readExampleCsv('U18666165_20240819_20250819.csv');
  const secondCsv = readExampleCsv('U18666165_20250819_20260513.csv');

  it('detects both real IBKR activity statement CSV files', () => {
    expect(
      detectIbkrTransactionHistoryCsv(firstCsv)
        .isIbkrTransactionHistoryCsv,
    ).toBe(true);
    expect(
      detectIbkrTransactionHistoryCsv(secondCsv)
        .isIbkrTransactionHistoryCsv,
    ).toBe(true);
  });

  it('rejects CSV content without a supported trade header', () => {
    const detection = detectIbkrTransactionHistoryCsv('foo,bar\n1,2');

    expect(detection.isIbkrTransactionHistoryCsv).toBe(false);
    expect(detection.missingHeaders).toEqual(['日期', '交易类型', '净额']);
  });

  it('finds the activity trade header and parses the first real file', () => {
    const result = parseIbkrCsv(firstCsv);

    expect(result.isSupported).toBe(true);
    expect(result.headerRowIndex).toBe(138);
    expect(result.headers).toEqual([
      'DataDiscriminator',
      '资产分类',
      '货币',
      '代码',
      '日期/时间',
      '数量',
      '交易价格',
      '收盘价格',
      '收益',
      '佣金/税',
      '基础',
      '已实现的损益',
      '按市值计算的损益',
      '代码',
    ]);
    expect(result.parsedEvents.length).toBeGreaterThan(100);
    expect(result.errors).toHaveLength(0);
    expect(result.summary).toMatchObject({
      totalRows: 536,
      depositTotal: 18556.74,
      withdrawalTotal: -5537.197728,
      netDeposit: 13019.542272,
    });
  });

  it('parses all required event types from the first real file', () => {
    const result = parseIbkrCsv(firstCsv);
    const eventTypes = new Set(
      result.parsedEvents.map((event) => event.eventType),
    );

    expect(eventTypes).toEqual(
      new Set([
        'TRADE_BUY',
        'TRADE_SELL',
        'DEPOSIT',
        'WITHDRAWAL',
        'DIVIDEND',
        'PAYMENT_IN_LIEU',
        'WITHHOLDING_TAX',
        'DEBIT_INTEREST',
        'FX_COMPONENT',
        'SPLIT',
        'STOCK_GRANT',
        'TRANSFER_OUT',
      ]),
    );

    const buy = result.parsedEvents.find(
      (event) => event.eventType === 'TRADE_BUY',
    );
    const sell = result.parsedEvents.find(
      (event) => event.eventType === 'TRADE_SELL',
    );
    const deposit = result.parsedEvents.find(
      (event) => event.eventType === 'DEPOSIT',
    );
    const withdrawal = result.parsedEvents.find(
      (event) => event.eventType === 'WITHDRAWAL',
    );

    expect(buy).toMatchObject({ side: 'BUY', isTrade: true });
    expect(sell).toMatchObject({ side: 'SELL', isTrade: true });
    expect(deposit).toMatchObject({ isExternalCashFlow: true });
    expect(withdrawal).toMatchObject({ isExternalCashFlow: true });
  });

  it('keeps raw row index and raw data for parsed trade events', () => {
    const result = parseIbkrCsv(secondCsv);
    const firstTrade = result.parsedEvents.find(
      (event) => event.sourceSection === '交易',
    );

    expect(firstTrade).toMatchObject({
      rawRowIndex: 158,
      rawData: {
        '日期/时间': '2025-09-09, 10:00:04',
        资产分类: '股票',
        代码: 'AAPL',
        收益: '947.6',
      },
    });
  });

  it('calculates the expected summary for the second real file', () => {
    const result = parseIbkrCsv(secondCsv);

    expect(result.summary).toMatchObject({
      totalRows: 605,
      depositTotal: 5508.722,
      withdrawalTotal: 0,
      netDeposit: 5508.722,
      dividendTotal: 94.67,
      taxAndFeeTotal: -80.37,
    });
  });

  it('generates a warning for unknown transaction history types', () => {
    const content = [
      'Transaction History,Header,日期,账户,说明,交易类型,代码,数量,价格,Price Currency,总额,佣金,净额',
      'Transaction History,Data,2026-01-01,U***1,Unknown row,神秘类型,ABC,1,10,USD,-10,-1,-11',
    ].join('\n');

    const result = parseIbkrCsv(content);

    expect(result.parsedEvents[0].eventType).toBe('UNKNOWN');
    expect(result.warnings[0].message).toContain(
      'Unknown IBKR transaction type',
    );
  });
});
