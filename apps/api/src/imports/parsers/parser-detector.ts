import { parse } from 'csv-parse/sync';

export const TRANSACTION_HISTORY_SECTION = 'Transaction History';
export const ACTIVITY_TRADE_SECTION = '交易';

export const REQUIRED_TRANSACTION_HISTORY_HEADERS = [
  '日期',
  '交易类型',
  '净额',
] as const;

export const REQUIRED_ACTIVITY_TRADE_HEADERS = [
  '日期/时间',
  '数量',
  '收益',
] as const;

export type IbkrCsvFormat = 'transaction-history' | 'activity-statement';

export interface ParserDetectionResult {
  isIbkrTransactionHistoryCsv: boolean;
  format?: IbkrCsvFormat;
  headerRowIndex?: number;
  headers: string[];
  missingHeaders: string[];
}

export function parseCsvRows(content: string): string[][] {
  return parse(content.replace(/^\uFEFF/, ''), {
    bom: true,
    relax_column_count: true,
    skip_empty_lines: true,
    trim: false,
  }) as string[][];
}

export function detectIbkrTransactionHistoryCsv(
  contentOrRows: string | string[][],
): ParserDetectionResult {
  const rows =
    typeof contentOrRows === 'string'
      ? parseCsvRows(contentOrRows)
      : contentOrRows;

  const transactionHistoryIndex = rows.findIndex(
    (row) =>
      row[0] === TRANSACTION_HISTORY_SECTION && row[1] === 'Header',
  );

  if (transactionHistoryIndex >= 0) {
    const headers = rows[transactionHistoryIndex].slice(2);
    const missingHeaders = REQUIRED_TRANSACTION_HISTORY_HEADERS.filter(
      (header) => !headers.includes(header),
    );

    return {
      isIbkrTransactionHistoryCsv: missingHeaders.length === 0,
      format: 'transaction-history',
      headerRowIndex: transactionHistoryIndex + 1,
      headers,
      missingHeaders,
    };
  }

  const activityTradeIndex = rows.findIndex(
    (row) => row[0] === ACTIVITY_TRADE_SECTION && row[1] === 'Header',
  );

  if (activityTradeIndex >= 0) {
    const headers = rows[activityTradeIndex].slice(2);
    const missingHeaders = REQUIRED_ACTIVITY_TRADE_HEADERS.filter(
      (header) => !headers.includes(header),
    );

    return {
      isIbkrTransactionHistoryCsv: missingHeaders.length === 0,
      format: 'activity-statement',
      headerRowIndex: activityTradeIndex + 1,
      headers,
      missingHeaders,
    };
  }

  return {
    isIbkrTransactionHistoryCsv: false,
    headers: [],
    missingHeaders: [...REQUIRED_TRANSACTION_HISTORY_HEADERS],
  };
}
