import Decimal from 'decimal.js';
import { deriveSide, mapIbkrTypeToEventType } from './ibkr-event-type.mapper';
import {
  detectIbkrTransactionHistoryCsv,
  parseCsvRows,
  TRANSACTION_HISTORY_SECTION,
} from './parser-detector';
import {
  IbkrCsvParseResult,
  IbkrEventType,
  ImportSummary,
  ParseIssue,
  TransactionEvent,
} from './transaction-event.types';

const EMPTY_MARKER = '-';
const TRADE_SECTION = '交易';
const DEPOSITS_SECTION = '存款和取款';
const DIVIDENDS_SECTION = '股息';
const TAX_SECTION = '代扣税';
const INTEREST_SECTION = '利息';
const FEES_SECTION = '费用';
const CORPORATE_ACTIONS_SECTION = '公司行动';
const STOCK_GRANT_SECTION = '股票赠与活动';

const REQUIRED_TRANSACTION_HISTORY_FIELDS = [
  '日期',
  '账户',
  '说明',
  '交易类型',
  '代码',
  '数量',
  '价格',
  'Price Currency',
  '总额',
  '佣金',
  '净额',
] as const;

function emptySummary(totalRows = 0): ImportSummary {
  return {
    totalRows,
    parsedRows: 0,
    tradeRows: 0,
    cashFlowRows: 0,
    warningCount: 0,
    errorCount: 0,
    depositTotal: 0,
    withdrawalTotal: 0,
    netDeposit: 0,
    dividendTotal: 0,
    taxAndFeeTotal: 0,
    tradeBuyTotal: 0,
    tradeSellTotal: 0,
    commissionTotal: 0,
  };
}

function normalizeOptionalText(value: string | undefined): string | undefined {
  if (!value || value === EMPTY_MARKER) {
    return undefined;
  }

  return value;
}

function parseOptionalNumber(value: string | undefined): number | undefined {
  if (!value || value === EMPTY_MARKER) {
    return undefined;
  }

  const parsed = Number(value.replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseAmount(value: string | undefined): number {
  return parseOptionalNumber(value) ?? 0;
}

function toPlainNumber(value: Decimal): number {
  return Number(value.toDecimalPlaces(6).toString());
}

function buildRawData(
  headers: string[],
  dataColumns: string[],
): Record<string, string> {
  return headers.reduce<Record<string, string>>((rawData, header, index) => {
    if (!(header in rawData)) {
      rawData[header] = dataColumns[index] ?? '';
    } else {
      rawData[`${header}__${index}`] = dataColumns[index] ?? '';
    }
    return rawData;
  }, {});
}

function splitDateTime(value: string | undefined): string {
  if (!value) {
    return '';
  }

  return value.split(',')[0]?.trim() ?? '';
}

function sumAmount(amount: number, commission: number): number {
  return Number(new Decimal(amount).plus(commission).toString());
}

function createEventFromTransactionHistoryRawData(
  rawData: Record<string, string>,
  rawRowIndex: number,
): TransactionEvent {
  const ibkrType = rawData['交易类型'] ?? '';
  const eventType = mapIbkrTypeToEventType(ibkrType);
  const quantity = parseOptionalNumber(rawData['数量']);
  const side = deriveSide(eventType);

  return {
    source: 'IBKR_CSV',
    sourceSection: TRANSACTION_HISTORY_SECTION,
    rawRowIndex,
    rawData,
    tradeDate: rawData['日期'] ?? '',
    accountId: rawData['账户'] ?? '',
    description: rawData['说明'] ?? '',
    ibkrType,
    eventType,
    symbol: normalizeOptionalText(rawData['代码']),
    quantity,
    absQuantity:
      typeof quantity === 'number' ? Math.abs(quantity) : undefined,
    price: parseOptionalNumber(rawData['价格']),
    currency: normalizeOptionalText(rawData['Price Currency']),
    grossAmount: parseAmount(rawData['总额']),
    commission: parseAmount(rawData['佣金']),
    netAmount: parseAmount(rawData['净额']),
    side,
    isTrade: eventType === 'TRADE_BUY' || eventType === 'TRADE_SELL',
    isExternalCashFlow:
      eventType === 'DEPOSIT' || eventType === 'WITHDRAWAL',
    isIncome: eventType === 'DIVIDEND' || eventType === 'PAYMENT_IN_LIEU',
    isTaxOrFee:
      eventType === 'WITHHOLDING_TAX' ||
      eventType === 'DEBIT_INTEREST' ||
      eventType === 'OTHER_FEE',
  };
}

function createActivityTradeEvent(
  rawData: Record<string, string>,
  rawRowIndex: number,
  accountId: string,
): TransactionEvent {
  const assetClass = rawData['资产分类'] ?? '';
  const quantity = parseOptionalNumber(rawData['数量']);
  const grossAmount = parseAmount(rawData['收益']);
  const commission = parseAmount(
    rawData['佣金/税'] ?? rawData['佣金 USD'],
  );
  const isForex = assetClass === '外汇';
  const eventType: IbkrEventType = isForex
    ? 'FX_COMPONENT'
    : quantity && quantity < 0
      ? 'TRADE_SELL'
      : 'TRADE_BUY';
  const ibkrType = isForex
    ? '外汇交易组成部分'
    : quantity && quantity < 0
      ? '卖'
      : '买';

  return {
    source: 'IBKR_CSV',
    sourceSection: TRADE_SECTION,
    rawRowIndex,
    rawData,
    tradeDate: splitDateTime(rawData['日期/时间']),
    accountId,
    description: isForex
      ? `外汇交易 ${rawData['代码'] ?? ''}`.trim()
      : `股票交易 ${rawData['代码'] ?? ''}`.trim(),
    ibkrType,
    eventType,
    symbol: normalizeOptionalText(rawData['代码']),
    quantity,
    absQuantity:
      typeof quantity === 'number' ? Math.abs(quantity) : undefined,
    price: parseOptionalNumber(rawData['交易价格']),
    currency: normalizeOptionalText(rawData['货币']),
    grossAmount,
    commission,
    netAmount: sumAmount(grossAmount, commission),
    side: isForex ? undefined : deriveSide(eventType),
    isTrade: !isForex && (eventType === 'TRADE_BUY' || eventType === 'TRADE_SELL'),
    isExternalCashFlow: false,
    isIncome: false,
    isTaxOrFee: false,
  };
}

function createActivityCashEvent(
  rawData: Record<string, string>,
  rawRowIndex: number,
  accountId: string,
  sourceSection: string,
  ibkrType: string,
  dateField: string,
  descriptionField: string,
): TransactionEvent {
  const eventType = mapIbkrTypeToEventType(ibkrType);
  const grossAmount = parseAmount(rawData['金额']);

  return {
    source: 'IBKR_CSV',
    sourceSection,
    rawRowIndex,
    rawData,
    tradeDate: rawData[dateField] ?? '',
    accountId,
    description: rawData[descriptionField] ?? '',
    ibkrType,
    eventType,
    symbol: normalizeOptionalText(rawData['代码']),
    quantity: undefined,
    absQuantity: undefined,
    price: undefined,
    currency: normalizeOptionalText(rawData['货币']),
    grossAmount,
    commission: 0,
    netAmount: grossAmount,
    side: undefined,
    isTrade: false,
    isExternalCashFlow:
      eventType === 'DEPOSIT' || eventType === 'WITHDRAWAL',
    isIncome: eventType === 'DIVIDEND' || eventType === 'PAYMENT_IN_LIEU',
    isTaxOrFee:
      eventType === 'WITHHOLDING_TAX' ||
      eventType === 'DEBIT_INTEREST' ||
      eventType === 'OTHER_FEE',
  };
}

function extractSymbolFromDescription(description: string): string | undefined {
  const match = description.match(/^([A-Z][A-Z0-9.\s-]*)\(/);
  return normalizeOptionalText(match?.[1]?.trim());
}

function createCorporateActionEvent(
  rawData: Record<string, string>,
  rawRowIndex: number,
  accountId: string,
): TransactionEvent {
  const description = rawData['描述'] ?? '';
  const quantity = parseOptionalNumber(rawData['数量']);
  const symbol =
    normalizeOptionalText(rawData['代码']) ??
    extractSymbolFromDescription(description);
  const eventType: IbkrEventType = description.includes('合股')
    ? 'REVERSE_SPLIT'
    : description.includes('拆股')
      ? 'SPLIT'
      : 'ADJUSTMENT';

  return {
    source: 'IBKR_CSV',
    sourceSection: CORPORATE_ACTIONS_SECTION,
    rawRowIndex,
    rawData,
    tradeDate: rawData['报告日期'] ?? splitDateTime(rawData['日期/时间']),
    accountId,
    description,
    ibkrType: eventType,
    eventType,
    symbol,
    quantity,
    absQuantity:
      typeof quantity === 'number' ? Math.abs(quantity) : undefined,
    price: undefined,
    currency: normalizeOptionalText(rawData['货币']),
    grossAmount: parseAmount(rawData['价值']),
    commission: 0,
    netAmount: parseAmount(rawData['收益']),
    side: undefined,
    isTrade: false,
    isExternalCashFlow: false,
    isIncome: false,
    isTaxOrFee: false,
  };
}

function createStockGrantEvent(
  rawData: Record<string, string>,
  rawRowIndex: number,
  accountId: string,
): TransactionEvent {
  const quantity = parseOptionalNumber(rawData['数量']);
  const description = rawData['描述'] ?? '';
  const eventType: IbkrEventType =
    typeof quantity === 'number' && quantity < 0 ? 'TRANSFER_OUT' : 'STOCK_GRANT';

  return {
    source: 'IBKR_CSV',
    sourceSection: STOCK_GRANT_SECTION,
    rawRowIndex,
    rawData,
    tradeDate: rawData['报告日期'] ?? '',
    accountId,
    description,
    ibkrType: eventType,
    eventType,
    symbol: normalizeOptionalText(rawData['代码']),
    quantity,
    absQuantity:
      typeof quantity === 'number' ? Math.abs(quantity) : undefined,
    price: parseOptionalNumber(rawData['价格']),
    currency: 'USD',
    // IBKR 股票奖励活动里的“价值”先作为 cost basis 使用；缺失时 lot calculator 会按 0 并返回 warning。
    grossAmount: parseAmount(rawData['价值']),
    commission: 0,
    netAmount: 0,
    side: undefined,
    isTrade: false,
    isExternalCashFlow: false,
    isIncome: false,
    isTaxOrFee: false,
  };
}

function calculateSummary(
  totalRows: number,
  events: TransactionEvent[],
  warnings: ParseIssue[],
  errors: ParseIssue[],
): ImportSummary {
  const totals = events.reduce(
    (acc, event) => {
      const netAmount = new Decimal(event.netAmount);
      const grossAmount = new Decimal(event.grossAmount);
      const commission = new Decimal(event.commission);

      acc.commissionTotal = acc.commissionTotal.plus(commission);

      if (event.isTrade) {
        acc.tradeRows += 1;
      } else {
        acc.cashFlowRows += 1;
      }

      if (event.eventType === 'DEPOSIT') {
        acc.depositTotal = acc.depositTotal.plus(netAmount);
      }

      if (event.eventType === 'WITHDRAWAL') {
        acc.withdrawalTotal = acc.withdrawalTotal.plus(netAmount);
      }

      if (
        event.eventType === 'DIVIDEND' ||
        event.eventType === 'PAYMENT_IN_LIEU'
      ) {
        acc.dividendTotal = acc.dividendTotal.plus(netAmount);
      }

      if (
        event.eventType === 'WITHHOLDING_TAX' ||
        event.eventType === 'DEBIT_INTEREST' ||
        event.eventType === 'OTHER_FEE'
      ) {
        acc.taxAndFeeTotal = acc.taxAndFeeTotal.plus(netAmount);
      }

      if (event.eventType === 'TRADE_BUY') {
        acc.tradeBuyTotal = acc.tradeBuyTotal.plus(grossAmount);
      }

      if (event.eventType === 'TRADE_SELL') {
        acc.tradeSellTotal = acc.tradeSellTotal.plus(grossAmount);
      }

      return acc;
    },
    {
      tradeRows: 0,
      cashFlowRows: 0,
      depositTotal: new Decimal(0),
      withdrawalTotal: new Decimal(0),
      dividendTotal: new Decimal(0),
      taxAndFeeTotal: new Decimal(0),
      tradeBuyTotal: new Decimal(0),
      tradeSellTotal: new Decimal(0),
      commissionTotal: new Decimal(0),
    },
  );

  return {
    totalRows,
    parsedRows: events.length,
    tradeRows: totals.tradeRows,
    cashFlowRows: totals.cashFlowRows,
    warningCount: warnings.length,
    errorCount: errors.length,
    depositTotal: toPlainNumber(totals.depositTotal),
    withdrawalTotal: toPlainNumber(totals.withdrawalTotal),
    netDeposit: toPlainNumber(
      totals.depositTotal.plus(totals.withdrawalTotal),
    ),
    dividendTotal: toPlainNumber(totals.dividendTotal),
    taxAndFeeTotal: toPlainNumber(totals.taxAndFeeTotal),
    tradeBuyTotal: toPlainNumber(totals.tradeBuyTotal),
    tradeSellTotal: toPlainNumber(totals.tradeSellTotal),
    commissionTotal: toPlainNumber(totals.commissionTotal),
  };
}

function parseActivityStatementSummaryRows(rows: string[][]) {
  const cashReport = {
    beginningCash: new Decimal(0),
    deposits: new Decimal(0),
    withdrawals: new Decimal(0),
    buyCash: new Decimal(0),
    sellCash: new Decimal(0),
    dividends: new Decimal(0),
    paymentInLieu: new Decimal(0),
    withholdingTax: new Decimal(0),
    interest: new Decimal(0),
    commissions: new Decimal(0),
    fees: new Decimal(0),
    fxCashPnl: new Decimal(0),
    otherCashAdjustments: new Decimal(0),
    accruedDividend: new Decimal(0),
    cashBalance: new Decimal(0),
    settledCash: new Decimal(0),
  };
  let realizedPnlFromStatement: Decimal | undefined;

  rows.forEach((row) => {
    if (
      row[0] === '已实现和未实现的表现总结' &&
      row[1] === 'Data' &&
      row[2] === '总计（全部资产）'
    ) {
      realizedPnlFromStatement = new Decimal(parseAmount(row[9]));
      return;
    }

    if (
      row[0] !== '现金报告' ||
      row[1] !== 'Data' ||
      row[3] !== '基础货币总结'
    ) {
      return;
    }

    const amount = new Decimal(parseAmount(row[4]));
    const category = row[2];

    if (category === '期初现金') cashReport.beginningCash = amount;
    else if (category === '佣金') cashReport.commissions = amount;
    else if (category === '存款') cashReport.deposits = amount;
    else if (category === '取款') cashReport.withdrawals = amount;
    else if (category === '股息') cashReport.dividends = amount;
    else if (category === '支付和收到的经纪商利息') {
      cashReport.interest = amount;
    } else if (category === '交易（卖出）') {
      cashReport.sellCash = amount;
    } else if (category === '交易（买入）') {
      cashReport.buyCash = amount;
    } else if (category === '其它费用') {
      cashReport.fees = amount;
    } else if (category === '代替股息的支付') {
      cashReport.paymentInLieu = amount;
    } else if (category === '代扣税款') {
      cashReport.withholdingTax = amount;
    } else if (category === '现金外汇换算收益/损失') {
      cashReport.fxCashPnl = amount;
    } else if (category === '期末现金') {
      cashReport.cashBalance = amount;
    } else if (category === '期末已结算现金') {
      cashReport.settledCash = amount;
    }
  });

  const netDeposit = cashReport.deposits.plus(cashReport.withdrawals);

  return {
    depositTotal: toPlainNumber(cashReport.deposits),
    withdrawalTotal: toPlainNumber(cashReport.withdrawals),
    netDeposit: toPlainNumber(netDeposit),
    cashReport: {
      beginningCash: toPlainNumber(cashReport.beginningCash),
      deposits: toPlainNumber(cashReport.deposits),
      withdrawals: toPlainNumber(cashReport.withdrawals),
      buyCash: toPlainNumber(cashReport.buyCash),
      sellCash: toPlainNumber(cashReport.sellCash),
      dividends: toPlainNumber(cashReport.dividends),
      paymentInLieu: toPlainNumber(cashReport.paymentInLieu),
      withholdingTax: toPlainNumber(cashReport.withholdingTax),
      interest: toPlainNumber(cashReport.interest),
      commissions: toPlainNumber(cashReport.commissions),
      fees: toPlainNumber(cashReport.fees),
      fxCashPnl: toPlainNumber(cashReport.fxCashPnl),
      otherCashAdjustments: toPlainNumber(cashReport.otherCashAdjustments),
      accruedDividend: toPlainNumber(cashReport.accruedDividend),
      cashBalance: toPlainNumber(cashReport.cashBalance),
      settledCash: toPlainNumber(cashReport.settledCash),
    },
    realizedPnlFromStatement:
      realizedPnlFromStatement === undefined
        ? undefined
        : toPlainNumber(realizedPnlFromStatement),
  };
}

function validateEvent(event: TransactionEvent): ParseIssue[] {
  const issues: ParseIssue[] = [];

  if (!event.tradeDate) {
    issues.push({
      rawRowIndex: event.rawRowIndex,
      message: 'Transaction row is missing 日期.',
    });
  }

  if (!event.ibkrType) {
    issues.push({
      rawRowIndex: event.rawRowIndex,
      message: 'Transaction row is missing 交易类型.',
    });
  }

  if (event.eventType === 'UNKNOWN') {
    issues.push({
      rawRowIndex: event.rawRowIndex,
      message: `Unknown IBKR transaction type: ${event.ibkrType || '(empty)'}.`,
    });
  }

  return issues;
}

function parseAccountId(rows: string[][]): string {
  const accountRow = rows.find(
    (row) => row[0] === '账户信息' && row[1] === 'Data' && row[2] === '账户',
  );

  return accountRow?.[3] ?? '';
}

function parseActivityStatementRows(
  rows: string[][],
  warnings: ParseIssue[],
): TransactionEvent[] {
  const parsedEvents: TransactionEvent[] = [];
  const accountId = parseAccountId(rows);
  const headersBySection = new Map<string, string[]>();

  rows.forEach((row, index) => {
    const rawRowIndex = index + 1;
    const section = row[0];
    const rowType = row[1];

    if (rowType === 'Header') {
      headersBySection.set(section, row.slice(2));
      return;
    }

    if (rowType !== 'Data') {
      return;
    }

    const headers = headersBySection.get(section);
    if (!headers) {
      return;
    }

    if (section === TRADE_SECTION) {
      if (row[2] !== 'Order') {
        return;
      }

      const rawData = buildRawData(headers, row.slice(2));
      parsedEvents.push(
        createActivityTradeEvent(rawData, rawRowIndex, accountId),
      );
      return;
    }

    if (section === DEPOSITS_SECTION) {
      if (row[2]?.startsWith('总数') || !row[3]) {
        return;
      }

      const rawData = buildRawData(headers, row.slice(2));
      const amount = parseAmount(rawData['金额']);
      parsedEvents.push(
        createActivityCashEvent(
          rawData,
          rawRowIndex,
          accountId,
          DEPOSITS_SECTION,
          amount >= 0 ? '存款' : '取款',
          '结算日期',
          '描述',
        ),
      );
      return;
    }

    if (section === DIVIDENDS_SECTION) {
      if (row[2]?.startsWith('总数')) {
        return;
      }

      const rawData = buildRawData(headers, row.slice(2));
      const description = rawData['描述'] ?? '';
      parsedEvents.push(
        createActivityCashEvent(
          rawData,
          rawRowIndex,
          accountId,
          DIVIDENDS_SECTION,
          description.includes('替代股息的付款') ? '替代支付' : '股息',
          '日期',
          '描述',
        ),
      );
      return;
    }

    if (section === TAX_SECTION) {
      if (row[2]?.startsWith('总数')) {
        return;
      }

      const rawData = buildRawData(headers, row.slice(2));
      parsedEvents.push(
        createActivityCashEvent(
          rawData,
          rawRowIndex,
          accountId,
          TAX_SECTION,
          '外国预扣税',
          '日期',
          '描述',
        ),
      );
      return;
    }

    if (section === INTEREST_SECTION) {
      if (row[2]?.startsWith('总数')) {
        return;
      }

      const rawData = buildRawData(headers, row.slice(2));
      parsedEvents.push(
        createActivityCashEvent(
          rawData,
          rawRowIndex,
          accountId,
          INTEREST_SECTION,
          '借方利息',
          '日期',
          '描述',
        ),
      );
      return;
    }

    if (section === FEES_SECTION) {
      const feeType = row[2];
      if (!feeType || feeType.startsWith('总数')) {
        return;
      }

      const rawData = buildRawData(headers, row.slice(2));
      parsedEvents.push(
        createActivityCashEvent(
          rawData,
          rawRowIndex,
          accountId,
          FEES_SECTION,
          feeType,
          '日期',
          '描述',
        ),
      );
    }

    if (section === CORPORATE_ACTIONS_SECTION) {
      if (row[2]?.startsWith('总数')) {
        return;
      }

      const rawData = buildRawData(headers, row.slice(2));
      parsedEvents.push(
        createCorporateActionEvent(rawData, rawRowIndex, accountId),
      );
      return;
    }

    if (section === STOCK_GRANT_SECTION) {
      if (row[2]?.startsWith('总数')) {
        return;
      }

      const rawData = buildRawData(headers, row.slice(2));
      parsedEvents.push(createStockGrantEvent(rawData, rawRowIndex, accountId));
    }
  });

  for (const event of parsedEvents) {
    warnings.push(...validateEvent(event));
  }

  return parsedEvents;
}

export function parseIbkrCsv(content: string): IbkrCsvParseResult {
  const warnings: ParseIssue[] = [];
  const errors: ParseIssue[] = [];
  let rows: string[][];

  try {
    rows = parseCsvRows(content);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      isSupported: false,
      headers: [],
      parsedEvents: [],
      summary: {
        ...emptySummary(),
        errorCount: 1,
      },
      warnings: [],
      errors: [{ message: `CSV parse failed: ${message}` }],
    };
  }

  const detection = detectIbkrTransactionHistoryCsv(rows);
  if (!detection.isIbkrTransactionHistoryCsv) {
    errors.push({
      rawRowIndex: detection.headerRowIndex,
      message:
        detection.missingHeaders.length > 0
          ? `Missing supported IBKR headers: ${detection.missingHeaders.join(', ')}.`
          : 'Missing supported IBKR transaction section.',
    });

    return {
      isSupported: false,
      headerRowIndex: detection.headerRowIndex,
      headers: detection.headers,
      parsedEvents: [],
      summary: {
        ...emptySummary(rows.length),
        errorCount: errors.length,
      },
      warnings,
      errors,
    };
  }

  const parsedEvents: TransactionEvent[] = [];

  if (detection.format === 'transaction-history') {
    const missingFields = REQUIRED_TRANSACTION_HISTORY_FIELDS.filter(
      (field) => !detection.headers.includes(field),
    );
    for (const field of missingFields) {
      errors.push({
        rawRowIndex: detection.headerRowIndex,
        message: `Missing required Transaction History field: ${field}.`,
      });
    }

    rows.forEach((row, index) => {
      const rawRowIndex = index + 1;
      if (row[0] !== TRANSACTION_HISTORY_SECTION || row[1] !== 'Data') {
        return;
      }

      const dataColumns = row.slice(2);
      if (dataColumns.length !== detection.headers.length) {
        warnings.push({
          rawRowIndex,
          message: `Transaction History data column count ${dataColumns.length} does not match header count ${detection.headers.length}.`,
        });
      }

      const rawData = buildRawData(detection.headers, dataColumns);
      const event = createEventFromTransactionHistoryRawData(
        rawData,
        rawRowIndex,
      );
      warnings.push(...validateEvent(event));
      parsedEvents.push(event);
    });
  } else if (detection.format === 'activity-statement') {
    parsedEvents.push(...parseActivityStatementRows(rows, warnings));
  }

  if (parsedEvents.length === 0) {
    errors.push({
      rawRowIndex: detection.headerRowIndex,
      message: 'No supported transaction rows were found.',
    });
  }

  const summary = calculateSummary(rows.length, parsedEvents, warnings, errors);
  if (detection.format === 'activity-statement') {
    Object.assign(summary, parseActivityStatementSummaryRows(rows));
  }

  return {
    isSupported: errors.length === 0,
    headerRowIndex: detection.headerRowIndex,
    headers: detection.headers,
    parsedEvents,
    summary,
    warnings,
    errors,
  };
}

export function isEventType(event: TransactionEvent, type: IbkrEventType) {
  return event.eventType === type;
}
