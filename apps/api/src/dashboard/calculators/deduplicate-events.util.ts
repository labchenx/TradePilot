import { DashboardEventRow } from './dashboard-calculator.types';

export interface DeduplicateDashboardEventsResult {
  events: DashboardEventRow[];
  warnings: string[];
}

function decimalKey(value: { toString(): string } | null | undefined) {
  return value?.toString() ?? '';
}

function createTradeFingerprint(event: DashboardEventRow) {
  return [
    event.accountId,
    event.tradeDate.toISOString().slice(0, 10),
    event.symbol ?? '',
    event.eventType,
    decimalKey(event.quantity),
    decimalKey(event.price),
    decimalKey(event.netAmount),
    decimalKey(event.commission),
    event.currency ?? '',
    event.description,
  ].join('|');
}

/**
 * Dashboard 计算层的保守去重。
 *
 * IBKR 导出的两个日期区间如果首尾同日重叠，同一笔交易可能出现在两个 CSV 文件里。
 * 数据库当前只保证同一个 importFile 内 rawRowIndex 唯一，不能识别跨文件重叠。
 *
 * 去重规则刻意保守：
 * - 只处理交易类事件
 * - 指纹完全一致
 * - 且来自不同 importFile
 *
 * 同一个文件里的相同交易会保留，因为那可能是真实的两笔同日同价成交。
 */
export function deduplicateDashboardEvents(
  events: DashboardEventRow[],
): DeduplicateDashboardEventsResult {
  const seenTrades = new Map<string, DashboardEventRow>();
  const dedupedEvents: DashboardEventRow[] = [];
  const skipped: DashboardEventRow[] = [];

  for (const event of events) {
    if (!event.isTrade) {
      dedupedEvents.push(event);
      continue;
    }

    const fingerprint = createTradeFingerprint(event);
    const existing = seenTrades.get(fingerprint);

    if (existing && existing.importFileId !== event.importFileId) {
      skipped.push(event);
      continue;
    }

    seenTrades.set(fingerprint, event);
    dedupedEvents.push(event);
  }

  const warnings =
    skipped.length > 0
      ? [
          `检测到 ${skipped.length} 条跨文件重复交易，Dashboard 计算已跳过重复项。常见原因是两份 IBKR CSV 的日期区间首尾重叠。`,
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
