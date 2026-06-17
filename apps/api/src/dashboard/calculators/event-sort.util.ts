import { DashboardEventRow } from './dashboard-calculator.types';

interface SortKey {
  timestamp: number;
  rawRowIndex: number;
  createdAt: number;
  id: string;
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function normalizeTime(value: string) {
  return value.length === 5 ? `${value}:00` : value;
}

function parseDateTimeParts(value: string) {
  const dateTimeMatch = value.match(
    /\b(\d{4})-(\d{2})-(\d{2})[,\sT]+(\d{2}:\d{2}(?::\d{2})?)\b/,
  );
  if (dateTimeMatch) {
    return {
      date: `${dateTimeMatch[1]}-${dateTimeMatch[2]}-${dateTimeMatch[3]}`,
      time: normalizeTime(dateTimeMatch[4]),
    };
  }

  const timeMatch = value.match(/\b(\d{2}:\d{2}(?::\d{2})?)\b/);
  return timeMatch ? { date: null, time: normalizeTime(timeMatch[1]) } : null;
}

function findRawTradeDateTime(rawData: unknown) {
  const topLevel = asRecord(rawData);
  const nested = asRecord(topLevel.rawData);
  const values = [
    topLevel.tradeDateTime,
    topLevel.tradeTime,
    topLevel.time,
    nested.tradeDateTime,
    nested.tradeTime,
    nested.time,
    ...Object.values(topLevel),
    ...Object.values(nested),
  ];

  for (const value of values) {
    if (typeof value !== 'string') continue;
    const parsed = parseDateTimeParts(value.trim());
    if (parsed) return parsed;
  }

  const tokens = Array.isArray(nested.tokens) ? nested.tokens : [];
  for (const token of tokens) {
    if (typeof token !== 'string') continue;
    const parsed = parseDateTimeParts(token.trim());
    if (parsed) return parsed;
  }

  return null;
}

function buildTimestamp(date: string, time: string) {
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute, second] = time.split(':').map(Number);
  return Date.UTC(year, month - 1, day, hour, minute, second ?? 0);
}

function getEventSortKey(event: DashboardEventRow): SortKey {
  const parsed = findRawTradeDateTime(event.rawData);
  const fallbackDate = event.tradeDate.toISOString().slice(0, 10);
  const date = parsed?.date ?? fallbackDate;
  const time = parsed?.time ?? '00:00:00';

  return {
    timestamp: buildTimestamp(date, time),
    rawRowIndex: event.rawRowIndex,
    createdAt: event.createdAt.getTime(),
    id: event.id,
  };
}

export function compareDashboardEventsByExecutionTime(
  left: DashboardEventRow,
  right: DashboardEventRow,
) {
  const leftKey = getEventSortKey(left);
  const rightKey = getEventSortKey(right);

  if (leftKey.timestamp !== rightKey.timestamp) {
    return leftKey.timestamp - rightKey.timestamp;
  }
  if (leftKey.rawRowIndex !== rightKey.rawRowIndex) {
    return leftKey.rawRowIndex - rightKey.rawRowIndex;
  }
  if (leftKey.createdAt !== rightKey.createdAt) {
    return leftKey.createdAt - rightKey.createdAt;
  }

  return leftKey.id.localeCompare(rightKey.id);
}
