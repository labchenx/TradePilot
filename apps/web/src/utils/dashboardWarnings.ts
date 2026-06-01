export interface DashboardWarningGroup {
  key: string;
  title: string;
  count: number;
  examples: string[];
}

export interface DashboardWarningSummary {
  total: number;
  headline: string;
  groups: DashboardWarningGroup[];
  details: string[];
  hiddenDetailCount: number;
}

const MAX_EXAMPLES_PER_GROUP = 3;
const MAX_DETAIL_WARNINGS = 12;

const warningGroups = [
  {
    key: 'quote-request',
    title: '当前行情请求失败',
    match: (warning: string) =>
      warning.includes('行情获取失败') ||
      warning.includes('批量行情请求失败') ||
      warning.includes('实时行情不可用') ||
      warning.includes('缺少可用行情价格') ||
      warning.includes('缺少行情'),
  },
  {
    key: 'history-price',
    title: '历史行情缺失',
    match: (warning: string) =>
      warning.includes('historical price request failed') ||
      warning.includes('month-end close price is missing') ||
      warning.includes('month-end price is missing') ||
      warning.includes('历史价格') ||
      warning.includes('月末价格'),
  },
  {
    key: 'currency',
    title: '汇率换算提示',
    match: (warning: string) =>
      warning.includes('汇率') ||
      warning.includes('currency') ||
      warning.includes('Currency'),
  },
  {
    key: 'duplicate',
    title: '重复交易提示',
    match: (warning: string) =>
      warning.includes('重复交易') ||
      warning.includes('duplicate') ||
      warning.includes('Duplicate'),
  },
] satisfies Array<{
  key: string;
  title: string;
  match: (warning: string) => boolean;
}>;

export function summarizeDashboardWarnings(
  warnings: string[],
): DashboardWarningSummary | null {
  const uniqueWarnings = Array.from(
    new Set(warnings.map((warning) => warning.trim()).filter(Boolean)),
  );

  if (uniqueWarnings.length === 0) return null;

  const grouped = new Map<string, DashboardWarningGroup>();
  const otherWarnings: string[] = [];

  for (const warning of uniqueWarnings) {
    const groupMeta = warningGroups.find((group) => group.match(warning));

    if (!groupMeta) {
      otherWarnings.push(warning);
      continue;
    }

    const current =
      grouped.get(groupMeta.key) ??
      ({
        key: groupMeta.key,
        title: groupMeta.title,
        count: 0,
        examples: [],
      } satisfies DashboardWarningGroup);

    current.count += 1;
    if (current.examples.length < MAX_EXAMPLES_PER_GROUP) {
      current.examples.push(warning);
    }
    grouped.set(groupMeta.key, current);
  }

  const groups = Array.from(grouped.values()).sort((a, b) => b.count - a.count);
  const primaryGroup = groups[0];
  const headline = primaryGroup
    ? `${primaryGroup.title}：已折叠 ${primaryGroup.count} 条相关提醒，页面会优先使用缓存或将不完整指标显示为 --。`
    : uniqueWarnings[0];
  const details = [...groups.flatMap((group) => group.examples), ...otherWarnings].slice(
    0,
    MAX_DETAIL_WARNINGS,
  );

  return {
    total: uniqueWarnings.length,
    headline,
    groups,
    details,
    hiddenDetailCount: Math.max(0, uniqueWarnings.length - details.length),
  };
}
