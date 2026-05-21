import { readFileSync } from 'fs';
import { resolve } from 'path';
import { parseIbkrCsv } from './ibkr-csv-parser';
import { detectIbkrTransactionHistoryCsv } from './parser-detector';

const projectRoot = resolve(__dirname, '../../../../../');

function readExampleCsv(filename: string) {
  return readFileSync(resolve(projectRoot, 'examples/ibkr', filename), 'utf8');
}

describe('IBKR CSV parser', () => {
  const firstCsv = readExampleCsv('U18666165_20240819_20250516.csv');
  const secondCsv = readExampleCsv('U18666165_20250519_20260518.csv');

  it('detects both real IBKR activity statement CSV files', () => {
    expect(detectIbkrTransactionHistoryCsv(firstCsv).isIbkrTransactionHistoryCsv).toBe(true);
    expect(detectIbkrTransactionHistoryCsv(secondCsv).isIbkrTransactionHistoryCsv).toBe(true);
  });

  it('rejects CSV content without a supported trade header', () => {
    const detection = detectIbkrTransactionHistoryCsv('foo,bar\n1,2');

    expect(detection.isIbkrTransactionHistoryCsv).toBe(false);
    expect(detection.missingHeaders.length).toBeGreaterThan(0);
  });

  it('parses a real activity statement into normalized events', () => {
    const result = parseIbkrCsv(firstCsv);

    expect(result.isSupported).toBe(true);
    expect(result.headerRowIndex).toBeGreaterThan(0);
    expect(result.parsedEvents.length).toBeGreaterThan(100);
    expect(result.errors).toHaveLength(0);
    expect(result.summary.totalRows).toBeGreaterThan(100);
    expect(typeof result.summary.netDeposit).toBe('number');
  });

  it('parses all core event families needed by the import flow', () => {
    const result = parseIbkrCsv(firstCsv);
    const eventTypes = new Set(result.parsedEvents.map((event) => event.eventType));

    expect(eventTypes.has('TRADE_BUY')).toBe(true);
    expect(eventTypes.has('TRADE_SELL')).toBe(true);
    expect(eventTypes.has('DEPOSIT')).toBe(true);
    expect(eventTypes.has('WITHDRAWAL')).toBe(true);
    expect(eventTypes.has('DIVIDEND')).toBe(true);
    expect(eventTypes.has('WITHHOLDING_TAX')).toBe(true);
  });

  it('keeps raw row index and raw data for audit drill-down', () => {
    const result = parseIbkrCsv(secondCsv);
    const firstTrade = result.parsedEvents.find((event) => event.isTrade);

    expect(firstTrade).toMatchObject({
      rawRowIndex: expect.any(Number),
      rawData: expect.any(Object),
      sourceSection: expect.any(String),
    });
  });

  it('calculates a summary for a second overlapping statement', () => {
    const result = parseIbkrCsv(secondCsv);

    expect(result.summary.totalRows).toBeGreaterThan(100);
    expect(result.summary.tradeRows).toBeGreaterThan(0);
    expect(result.summary.cashFlowRows).toBeGreaterThan(0);
  });

});
