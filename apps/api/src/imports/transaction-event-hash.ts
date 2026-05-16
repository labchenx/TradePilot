import { createHash } from 'crypto';
import { TransactionEvent } from './parsers/transaction-event.types';

function normalizeNumber(value: number | undefined): string | null {
  return typeof value === 'number' ? String(value) : null;
}

function sortRawData(rawData: Record<string, string>) {
  return Object.keys(rawData)
    .sort()
    .reduce<Record<string, string>>((sorted, key) => {
      sorted[key] = rawData[key];
      return sorted;
    }, {});
}

/**
 * Event-level import idempotency.
 *
 * IBKR activity statements can overlap at date boundaries, so the same event may
 * appear in two different CSV files with different rawRowIndex values. We keep
 * rawRowIndex out of this hash and include the normalized rawData payload, which
 * lets us detect cross-file duplicates without depending on the source row
 * number inside each file.
 */
export function createTransactionEventHash(event: TransactionEvent): string {
  const payload = {
    source: event.source,
    sourceSection: event.sourceSection,
    tradeDate: event.tradeDate,
    accountId: event.accountId,
    description: event.description,
    ibkrType: event.ibkrType,
    eventType: event.eventType,
    symbol: event.symbol ?? null,
    quantity: normalizeNumber(event.quantity),
    absQuantity: normalizeNumber(event.absQuantity),
    price: normalizeNumber(event.price),
    currency: event.currency ?? null,
    grossAmount: normalizeNumber(event.grossAmount),
    commission: normalizeNumber(event.commission),
    netAmount: normalizeNumber(event.netAmount),
    side: event.side ?? null,
    rawData: sortRawData(event.rawData),
  };

  return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}
