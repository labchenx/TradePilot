import Decimal from 'decimal.js';

interface TradeIdentityInput {
  accountId?: string | null;
  tradeDate: string | Date;
  eventType?: string | null;
  symbol?: string | null;
  side?: string | null;
  quantity?: unknown;
  absQuantity?: unknown;
  price?: unknown;
  currency?: string | null;
  rawData?: unknown;
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function stringValue(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeDecimal(value: unknown, places: number) {
  if (value === null || value === undefined) return '';

  try {
    return new Decimal(String(value)).toDecimalPlaces(places).toString();
  } catch {
    return '';
  }
}

function normalizeQuantity(input: TradeIdentityInput) {
  const value = input.absQuantity ?? input.quantity;
  if (value === null || value === undefined) return '';

  try {
    return new Decimal(String(value)).abs().toDecimalPlaces(8).toString();
  } catch {
    return '';
  }
}

function normalizeAccount(accountId: string | null | undefined) {
  const digits = (accountId ?? '').replace(/\D/g, '');
  if (digits.length >= 4) return digits.slice(-4);

  return (accountId ?? '').replace(/\*/g, '').trim().toUpperCase();
}

function normalizeTradeDate(value: string | Date) {
  return value instanceof Date ? value.toISOString().slice(0, 10) : value.slice(0, 10);
}

function normalizeEventType(input: TradeIdentityInput) {
  if (input.eventType === 'TRADE_BUY' || input.side === 'BUY') return 'TRADE_BUY';
  if (input.eventType === 'TRADE_SELL' || input.side === 'SELL') return 'TRADE_SELL';
  return input.eventType ?? '';
}

function extractTradeTime(input: TradeIdentityInput) {
  const rawData = asRecord(input.rawData);
  const nestedRawData = asRecord(rawData.rawData);
  const tradeDateTime =
    stringValue(rawData.tradeDateTime) ||
    stringValue(rawData['日期/时间']) ||
    stringValue(nestedRawData.tradeDateTime) ||
    stringValue(rawData.tradeTime) ||
    stringValue(rawData.time);

  const dateTimeMatch = tradeDateTime.match(/\d{4}-\d{2}-\d{2}[,\s]+(\d{2}:\d{2}(?::\d{2})?)/);
  if (dateTimeMatch) return normalizeTime(dateTimeMatch[1]);

  const timeMatch = tradeDateTime.match(/\b(\d{2}:\d{2}(?::\d{2})?)\b/);
  if (timeMatch) return normalizeTime(timeMatch[1]);

  const tokens = Array.isArray(nestedRawData.tokens) ? nestedRawData.tokens : [];
  const tokenTime = tokens.find(
    (token): token is string =>
      typeof token === 'string' && /^\d{2}:\d{2}(?::\d{2})?$/.test(token),
  );
  if (tokenTime) return normalizeTime(tokenTime);

  const manualNote = rawData.source === 'MANUAL_GAP_FILL' ? stringValue(rawData.note) : '';
  return manualNote ? `note:${manualNote}` : '';
}

function normalizeTime(value: string) {
  return value.length === 5 ? `${value}:00` : value;
}

export function createCrossSourceTradeFingerprint(input: TradeIdentityInput) {
  const eventType = normalizeEventType(input);
  if (eventType !== 'TRADE_BUY' && eventType !== 'TRADE_SELL') {
    return null;
  }

  const payload = [
    normalizeAccount(input.accountId),
    normalizeTradeDate(input.tradeDate),
    extractTradeTime(input),
    (input.symbol ?? '').trim().toUpperCase(),
    eventType,
    normalizeQuantity(input),
    normalizeDecimal(input.price, 6),
    (input.currency ?? '').trim().toUpperCase(),
  ];

  return payload.join('|');
}
