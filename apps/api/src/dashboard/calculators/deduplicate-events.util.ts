import { createCrossSourceTradeFingerprint } from '../../imports/trade-identity';
import { DashboardEventRow } from './dashboard-calculator.types';

export interface DeduplicateDashboardEventsResult {
  events: DashboardEventRow[];
  warnings: string[];
}

function sourcePriority(event: DashboardEventRow) {
  const rawData = event.rawData as Record<string, unknown>;
  if (rawData?.source === 'MANUAL_GAP_FILL') return 0;
  if (event.source === 'IBKR_EMAIL_PDF') return 1;
  if (event.source === 'IBKR_CSV') return 2;
  return 1;
}

function shouldPreferCandidate(existing: DashboardEventRow, candidate: DashboardEventRow) {
  const priorityDiff = sourcePriority(candidate) - sourcePriority(existing);
  if (priorityDiff !== 0) return priorityDiff > 0;

  return candidate.createdAt.getTime() < existing.createdAt.getTime();
}

/**
 * Conservative calculation-layer de-duplication.
 *
 * IBKR CSV statements and Daily Trade Report PDFs can contain the same fill.
 * They differ in source, rawData shape, masked account id and commission
 * precision, so sourceEventHash alone cannot catch the duplicate. The
 * cross-source fingerprint keeps the fields that identify the fill itself:
 * account tail, date/time, symbol, side, quantity, price and currency.
 */
export function deduplicateDashboardEvents(
  events: DashboardEventRow[],
): DeduplicateDashboardEventsResult {
  const seenTrades = new Map<string, DashboardEventRow>();
  const dedupedIndexes = new Map<string, number>();
  const dedupedEvents: DashboardEventRow[] = [];
  const skipped: DashboardEventRow[] = [];

  for (const event of events) {
    if (!event.isTrade) {
      dedupedEvents.push(event);
      continue;
    }

    const fingerprint = createCrossSourceTradeFingerprint(event);
    if (!fingerprint) {
      dedupedEvents.push(event);
      continue;
    }

    const existing = seenTrades.get(fingerprint);

    if (existing && existing.importFileId !== event.importFileId) {
      if (shouldPreferCandidate(existing, event)) {
        const existingIndex = dedupedIndexes.get(fingerprint);
        if (existingIndex !== undefined) {
          dedupedEvents[existingIndex] = event;
        }
        seenTrades.set(fingerprint, event);
        skipped.push(existing);
      } else {
        skipped.push(event);
      }
      continue;
    }

    seenTrades.set(fingerprint, event);
    dedupedIndexes.set(fingerprint, dedupedEvents.length);
    dedupedEvents.push(event);
  }

  const warnings =
    skipped.length > 0
      ? [
          `检测到 ${skipped.length} 条跨来源重复交易，组合计算已跳过重复项。常见原因是 CSV 和 Email PDF 包含同一笔 IBKR 成交。`,
          ...skipped.map(
            (event) =>
              `${event.tradeDate.toISOString().slice(0, 10)} ${event.symbol ?? '(no symbol)'} ${event.eventType} row ${event.rawRowIndex} from ${event.sourceFileName}`,
          ),
        ]
      : [];

  return {
    events: dedupedEvents,
    warnings,
  };
}
