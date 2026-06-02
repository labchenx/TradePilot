import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { parseIbkrCsv } from './ibkr-csv-parser';
import { detectIbkrTransactionHistoryCsv } from './parser-detector';

const projectRoot = resolve(__dirname, '../../../../../');

function readExampleCsv(filename: string) {
  const filePath = resolve(projectRoot, 'examples/ibkr', filename);
  return existsSync(filePath) ? readFileSync(filePath, 'utf8') : undefined;
}

describe('IBKR CSV parser', () => {
  const firstCsv = readExampleCsv('U18666165_20240819_20250516.csv');
  const secondCsv = readExampleCsv('U18666165_20250519_20260518.csv');
  const itWithExampleCsv = firstCsv && secondCsv ? it : it.skip;

  itWithExampleCsv('detects both real IBKR activity statement CSV files', () => {
    expect(detectIbkrTransactionHistoryCsv(firstCsv as string).isIbkrTransactionHistoryCsv).toBe(true);
    expect(detectIbkrTransactionHistoryCsv(secondCsv as string).isIbkrTransactionHistoryCsv).toBe(true);
  });

  it('rejects CSV content without a supported trade header', () => {
    const detection = detectIbkrTransactionHistoryCsv('foo,bar\n1,2');

    expect(detection.isIbkrTransactionHistoryCsv).toBe(false);
    expect(detection.missingHeaders.length).toBeGreaterThan(0);
  });

  itWithExampleCsv('parses a real activity statement into normalized events', () => {
    const result = parseIbkrCsv(firstCsv as string);

    expect(result.isSupported).toBe(true);
    expect(result.headerRowIndex).toBeGreaterThan(0);
    expect(result.parsedEvents.length).toBeGreaterThan(100);
    expect(result.errors).toHaveLength(0);
    expect(result.summary.totalRows).toBeGreaterThan(100);
    expect(typeof result.summary.netDeposit).toBe('number');
  });

  itWithExampleCsv('parses all core event families needed by the import flow', () => {
    const result = parseIbkrCsv(firstCsv as string);
    const eventTypes = new Set(result.parsedEvents.map((event) => event.eventType));

    expect(eventTypes.has('TRADE_BUY')).toBe(true);
    expect(eventTypes.has('TRADE_SELL')).toBe(true);
    expect(eventTypes.has('DEPOSIT')).toBe(true);
    expect(eventTypes.has('WITHDRAWAL')).toBe(true);
    expect(eventTypes.has('DIVIDEND')).toBe(true);
    expect(eventTypes.has('WITHHOLDING_TAX')).toBe(true);
  });

  it('parses activity statement security transfers as transfer events', () => {
    const csv = [
      '账户信息,Header,域名称,域值',
      '账户信息,Data,账户,U1',
      '交易,Header,DataDiscriminator,资产分类,货币,代码,日期/时间,数量,交易价格,收盘价格,收益,佣金/税,基础,已实现的损益,按市值计算的损益,代码',
      '交易,Data,Order,股票,USD,ORCL,"2025-10-20, 09:49:15",4,283.5,277.18,-1134,-0.35,1134.35,0,-12.64,O',
      '转账,Header,资产分类,货币,代码,日期,类型,方向,转账公司,转账账户,数量,转账价格,市场价值,已实现的损益,现金金额,代码',
      '转账,Data,股票,USD,ORCL,2025-10-22,纯券过户（FOP）,出,--,90522366,-4,--,"-1,100.60",0.00,0.00,',
    ].join('\n');

    const result = parseIbkrCsv(csv);
    const transfer = result.parsedEvents.find(
      (event) => event.sourceSection === '转账',
    );

    expect(result.isSupported).toBe(true);
    expect(transfer).toMatchObject({
      eventType: 'TRANSFER_OUT',
      symbol: 'ORCL',
      quantity: -4,
      absQuantity: 4,
      grossAmount: -1100.6,
      netAmount: 0,
      isTrade: false,
    });
  });

  itWithExampleCsv('keeps raw row index and raw data for audit drill-down', () => {
    const result = parseIbkrCsv(secondCsv as string);
    const firstTrade = result.parsedEvents.find((event) => event.isTrade);

    expect(firstTrade).toMatchObject({
      rawRowIndex: expect.any(Number),
      rawData: expect.any(Object),
      sourceSection: expect.any(String),
    });
  });

  itWithExampleCsv('calculates a summary for a second overlapping statement', () => {
    const result = parseIbkrCsv(secondCsv as string);

    expect(result.summary.totalRows).toBeGreaterThan(100);
    expect(result.summary.tradeRows).toBeGreaterThan(0);
    expect(result.summary.cashFlowRows).toBeGreaterThan(0);
  });

});
