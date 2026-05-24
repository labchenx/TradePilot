import { createHash } from 'crypto';

export type ParsedTradeSide = 'BUY' | 'SELL';

export interface ParsedIbkrPdfTrade {
  accountId?: string;
  symbol: string;
  tradeDateTime: string;
  tradeDate: string;
  settleDate?: string;
  exchange?: string;
  side: ParsedTradeSide;
  quantity: number;
  price: number;
  proceeds?: number;
  commission?: number;
  fee?: number;
  currency: string;
  orderType?: string;
  code?: string;
  rawText: string;
  rawData: Record<string, unknown>;
}

export interface ParsedIbkrPdfTradeError {
  rawText: string;
  message: string;
}

export interface ParseIbkrPdfTradesResult {
  trades: ParsedIbkrPdfTrade[];
  errors: ParsedIbkrPdfTradeError[];
  warnings: string[];
}

const DATE_TOKEN_REGEX = /^(?:\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{1,2}-\d{1,2})$/;
const DATE_ANYWHERE_REGEX = /\b(?:\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{1,2}-\d{1,2})\b/;
const TIME_TOKEN_REGEX = /^\d{1,2}:\d{2}(?::\d{2})?(?:\s?[AP]M)?$/i;
const SIDE_TOKEN_REGEX = /^(BUY|BOT|B|SELL|SLD|S)$/i;
const CURRENCY_TOKEN_REGEX = /^[A-Z]{3}$/;
const KNOWN_CURRENCY_TOKEN_REGEX =
  /^(USD|HKD|CNH|CNY|SGD|EUR|GBP|JPY|CAD|AUD|CHF)$/i;
const ORDER_TYPE_TOKEN_REGEX = /^(LMT|MKT|STP|STP LMT|LOC|MOC)$/i;
const ACCOUNT_TOKEN_REGEX = /^(?:D?U[\d*]{4,}|[A-Z]\d{5,})$/i;
const NUMERIC_TOKEN_REGEX =
  /^\(?[-+]?(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?\)?$/;

const SECTION_STOP_REGEX =
  /^(Open Positions|Financial Instrument Information|Deposits|Withdrawals|Dividends|Withholding Tax|Broker Interest|Corporate Actions|Statement of Funds|Notes|Trades Total|Total)$/i;

export function parseIbkrPdfTrades(text: string): ParseIbkrPdfTradesResult {
  const normalizedText = text.replace(/\u00a0/g, ' ');
  const lines = normalizedText
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+$/g, '').trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return {
      trades: [],
      errors: [],
      warnings: ['PDF text is empty.'],
    };
  }

  const tableLines = getTradesTableLines(lines);
  const rowTexts = collectTradeRows(tableLines);
  const trades: ParsedIbkrPdfTrade[] = [];
  const errors: ParsedIbkrPdfTradeError[] = [];

  for (const rowText of rowTexts) {
    const parsed = parseTradeRow(rowText);
    if ('message' in parsed) {
      errors.push(parsed);
    } else {
      trades.push(parsed);
    }
  }

  return {
    trades,
    errors,
    warnings: rowTexts.length === 0 ? ['No Trades table rows were found.'] : [],
  };
}

export function createEmailPdfTradeSourceHash(
  trade: Omit<ParsedIbkrPdfTrade, 'rawText' | 'rawData'>,
) {
  const payload = [
    'IBKR',
    trade.accountId ?? '',
    trade.tradeDateTime,
    trade.symbol,
    trade.side,
    normalizeHashNumber(trade.quantity),
    normalizeHashNumber(trade.price),
    normalizeHashNumber(trade.proceeds),
    normalizeHashNumber(trade.commission),
    normalizeHashNumber(trade.fee),
    trade.currency,
  ].join('|');

  return createHash('sha256').update(payload).digest('hex');
}

function getTradesTableLines(lines: string[]) {
  const tradesIndex = lines.findIndex((line) => /^Trades\b/i.test(line));
  const startIndex =
    tradesIndex >= 0
      ? Math.max(
          tradesIndex,
          lines.findIndex(
            (line, index) =>
              index >= tradesIndex &&
              /(Account|Acct).*Symbol/i.test(line) &&
              /(Quantity|Price|Proceeds)/i.test(line),
          ),
        )
      : 0;

  const output: string[] = [];
  for (const line of lines.slice(Math.max(startIndex, 0))) {
    if (output.length > 0 && SECTION_STOP_REGEX.test(line)) break;
    output.push(line);
  }
  return output;
}

function collectTradeRows(lines: string[]) {
  const rows: string[] = [];
  let current = '';

  for (const line of lines) {
    if (isHeaderOrSummaryLine(line)) continue;

    if (isLikelyTradeRowStart(line)) {
      if (current) rows.push(current);
      current = line;
      continue;
    }

    if (current && shouldAppendContinuation(line)) {
      current = `${current}\t${line}`;
    }
  }

  if (current) rows.push(current);
  return rows;
}

function isHeaderOrSummaryLine(line: string) {
  return (
    /^Trades\b/i.test(line) ||
    /(Account|Acct).*Symbol/i.test(line) ||
    /^Total\b/i.test(line) ||
    /^Sub-?Total\b/i.test(line)
  );
}

function isLikelyTradeRowStart(line: string) {
  return DATE_ANYWHERE_REGEX.test(line) && /\b(BUY|BOT|SELL|SLD)\b/i.test(line);
}

function shouldAppendContinuation(line: string) {
  return !SECTION_STOP_REGEX.test(line) && !isHeaderOrSummaryLine(line);
}

function parseTradeRow(rowText: string): ParsedIbkrPdfTrade | ParsedIbkrPdfTradeError {
  const tokens = tokenizeRow(rowText);
  const dateIndex = tokens.findIndex((token) => DATE_TOKEN_REGEX.test(token));
  const sideIndex = tokens.findIndex((token) => SIDE_TOKEN_REGEX.test(token));

  if (dateIndex < 0 || sideIndex < 0) {
    return {
      rawText: rowText,
      message: 'Missing trade date or side in Trades row.',
    };
  }

  const accountId = ACCOUNT_TOKEN_REGEX.test(tokens[0]) ? tokens[0] : undefined;
  const symbolStart = accountId ? 1 : 0;
  const symbol = tokens.slice(symbolStart, dateIndex).join(' ').trim();
  const timeIndex = TIME_TOKEN_REGEX.test(tokens[dateIndex + 1] ?? '')
    ? dateIndex + 1
    : -1;
  const tradeDateTime = normalizeDateTime(
    tokens[dateIndex],
    timeIndex >= 0 ? tokens[timeIndex] : undefined,
  );
  let cursor = timeIndex >= 0 ? timeIndex + 1 : dateIndex + 1;
  const settleDate = DATE_TOKEN_REGEX.test(tokens[cursor] ?? '')
    ? normalizeDate(tokens[cursor++])
    : undefined;
  const exchange =
    sideIndex > cursor ? tokens.slice(cursor, sideIndex).join(' ').trim() : undefined;
  const side = normalizeSide(tokens[sideIndex]);
  cursor = sideIndex + 1;

  const numericTokens: Array<{ token: string; index: number }> = [];
  for (let index = cursor; index < tokens.length; index += 1) {
    if (NUMERIC_TOKEN_REGEX.test(tokens[index])) {
      numericTokens.push({ token: tokens[index], index });
    }
  }

  const quantity = parseNumeric(numericTokens[0]?.token);
  const price = parseNumeric(numericTokens[1]?.token);
  const proceeds = parseOptionalNumeric(numericTokens[2]?.token);
  const commission = parseOptionalNumeric(numericTokens[3]?.token);
  const fee = parseOptionalNumeric(numericTokens[4]?.token);
  const currencyIndex = findCurrencyIndex(tokens);
  const currency = currencyIndex >= 0 ? tokens[currencyIndex] : '';
  const orderType =
    currencyIndex > 0
      ? tokens.slice((numericTokens[4]?.index ?? numericTokens[1]?.index ?? sideIndex) + 1, currencyIndex)[0]
      : undefined;
  const code =
    currencyIndex > 0
      ? tokens.slice((numericTokens[4]?.index ?? numericTokens[1]?.index ?? sideIndex) + 1, currencyIndex)[1]
      : undefined;

  const missing = [
    !symbol ? 'Symbol' : null,
    !tradeDateTime ? 'Trade Date/Time' : null,
    !side ? 'Type' : null,
    quantity === undefined ? 'Quantity' : null,
    price === undefined ? 'Price' : null,
    !currency ? 'Currency' : null,
  ].filter(Boolean);

  if (
    missing.length > 0 ||
    !side ||
    quantity === undefined ||
    price === undefined
  ) {
    return {
      rawText: rowText,
      message: `Missing required field(s): ${missing.join(', ')}.`,
    };
  }

  return {
    accountId,
    symbol,
    tradeDateTime,
    tradeDate: tradeDateTime.slice(0, 10),
    settleDate,
    exchange: exchange || undefined,
    side,
    quantity,
    price,
    proceeds,
    commission,
    fee,
    currency,
    orderType,
    code,
    rawText: rowText,
    rawData: {
      rowText,
      tokens,
    },
  };
}

function tokenizeRow(rowText: string) {
  const tabCells = rowText
    .split(/\t+/)
    .map((cell) => cell.trim())
    .filter(Boolean);
  const source = tabCells.length >= 8 ? tabCells : rowText.split(/\s{2,}/);
  const tokens: string[] = [];

  for (const cell of source) {
    const normalized = cell.trim();
    if (!normalized) continue;

    if (DATE_ANYWHERE_REGEX.test(normalized) || /\s/.test(normalized)) {
        tokens.push(...normalized.split(/\s+/).map(normalizeToken).filter(Boolean));
    } else {
      tokens.push(normalizeToken(normalized));
    }
  }

  return tokens;
}

function normalizeToken(value: string) {
  return value.trim().replace(/^[,;]+|[,;]+$/g, '');
}

function normalizeSide(value: string): ParsedTradeSide | null {
  if (/^(BUY|BOT|B)$/i.test(value)) return 'BUY';
  if (/^(SELL|SLD|S)$/i.test(value)) return 'SELL';
  return null;
}

function parseNumeric(value?: string) {
  if (!value) return undefined;
  const parsed = parseOptionalNumeric(value);
  return typeof parsed === 'number' ? parsed : undefined;
}

function parseOptionalNumeric(value?: string) {
  if (!value) return undefined;
  const isParenthesized = /^\(.*\)$/.test(value);
  const parsed = Number(value.replace(/[(),]/g, ''));
  if (!Number.isFinite(parsed)) return undefined;
  return isParenthesized ? -parsed : parsed;
}

function normalizeDateTime(date: string, time?: string) {
  const normalizedDate = normalizeDate(date);
  if (!normalizedDate) return '';
  return time ? `${normalizedDate} ${normalizeTime(time)}` : `${normalizedDate} 00:00:00`;
}

function normalizeDate(value?: string) {
  if (!value) return '';
  if (/^\d{4}-/.test(value)) {
    const [year, month, day] = value.split('-');
    return `${year}-${pad2(month)}-${pad2(day)}`;
  }

  const [month, day, year] = value.split('/');
  const fullYear = year.length === 2 ? `20${year}` : year;
  return `${fullYear}-${pad2(month)}-${pad2(day)}`;
}

function normalizeTime(value: string) {
  const upper = value.toUpperCase();
  const amPmMatch = upper.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s?([AP]M)$/);
  if (amPmMatch) {
    let hour = Number(amPmMatch[1]);
    if (amPmMatch[4] === 'PM' && hour < 12) hour += 12;
    if (amPmMatch[4] === 'AM' && hour === 12) hour = 0;
    return `${pad2(String(hour))}:${amPmMatch[2]}:${amPmMatch[3] ?? '00'}`;
  }

  const parts = value.split(':');
  return `${pad2(parts[0])}:${parts[1] ?? '00'}:${parts[2] ?? '00'}`;
}

function pad2(value: string) {
  return value.padStart(2, '0');
}

function findCurrencyIndex(tokens: string[]) {
  for (let index = tokens.length - 1; index >= 0; index -= 1) {
    if (KNOWN_CURRENCY_TOKEN_REGEX.test(tokens[index])) return index;
  }

  for (let index = tokens.length - 1; index >= 0; index -= 1) {
    if (
      CURRENCY_TOKEN_REGEX.test(tokens[index]) &&
      !ORDER_TYPE_TOKEN_REGEX.test(tokens[index])
    ) {
      return index;
    }
  }
  return -1;
}

function normalizeHashNumber(value?: number) {
  return typeof value === 'number' ? String(value) : null;
}
