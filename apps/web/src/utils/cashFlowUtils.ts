import type { CashFlow, CashFlowFiltersState } from '@/types';

const CSV_HEADERS = [
  '日期',
  '类型',
  '金额',
  '币种',
  '备注 / 来源',
];

function normalizeSearch(value: string | undefined) {
  return value?.trim().toLowerCase() ?? '';
}

function parseAmount(value: string) {
  if (!value.trim()) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function matchesAmountRange(flow: CashFlow, filters: CashFlowFiltersState) {
  const absoluteAmount = Math.abs(flow.amount);
  const minAmount = parseAmount(filters.minAmount);
  const maxAmount = parseAmount(filters.maxAmount);

  if (minAmount !== null && absoluteAmount < minAmount) return false;
  if (maxAmount !== null && absoluteAmount > maxAmount) return false;

  return true;
}

function sortCashFlows(
  flows: CashFlow[],
  filters: CashFlowFiltersState,
) {
  const direction = filters.sortDirection === 'asc' ? 1 : -1;

  return [...flows].sort((left, right) => {
    if (filters.sortBy === 'amount') {
      return (left.amount - right.amount) * direction;
    }

    if (filters.sortBy === 'type') {
      return left.type.localeCompare(right.type) * direction;
    }

    return left.date.localeCompare(right.date) * direction;
  });
}

export function filterAndSortCashFlows(
  flows: CashFlow[],
  filters: CashFlowFiltersState,
) {
  const search = normalizeSearch(filters.search);

  const filtered = flows.filter((flow) => {
    const matchesType = filters.type === 'ALL' || flow.type === filters.type;
    const matchesStartDate =
      !filters.startDate || flow.date >= filters.startDate;
    const matchesEndDate = !filters.endDate || flow.date <= filters.endDate;
    const matchesSearch =
      !search ||
      normalizeSearch(flow.remark).includes(search) ||
      normalizeSearch(flow.source).includes(search) ||
      normalizeSearch(flow.type).includes(search) ||
      String(Math.abs(flow.amount)).includes(search);

    return (
      matchesType &&
      matchesStartDate &&
      matchesEndDate &&
      matchesSearch &&
      matchesAmountRange(flow, filters)
    );
  });

  return sortCashFlows(filtered, filters);
}

function escapeCsvCell(value: string | number | undefined) {
  const text = value === undefined ? '' : String(value);

  if (!/[",\n]/.test(text)) {
    return text;
  }

  return `"${text.replace(/"/g, '""')}"`;
}

export function buildCashFlowsCsv(flows: CashFlow[]) {
  const rows = flows.map((flow) => [
    flow.date,
    flow.type,
    flow.amount,
    flow.currency,
    [flow.remark, flow.source].filter(Boolean).join(' / '),
  ]);

  return [CSV_HEADERS, ...rows]
    .map((row) => row.map(escapeCsvCell).join(','))
    .join('\n');
}

export function downloadCashFlowsCsv(flows: CashFlow[]) {
  const blob = new Blob([buildCashFlowsCsv(flows)], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `tradepilot-cash-flows-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
