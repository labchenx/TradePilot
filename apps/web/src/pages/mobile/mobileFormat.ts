export function money(value?: number | null, currency = 'USD') {
  if (value === null || value === undefined || Number.isNaN(value)) return '--';

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

export function signedMoney(value?: number | null, currency = 'USD') {
  if (value === null || value === undefined || Number.isNaN(value)) return '--';
  const prefix = value > 0 ? '+' : '';
  return `${prefix}${money(value, currency)}`;
}

export function percent(value?: number | null, inputIsRatio = false) {
  if (value === null || value === undefined || Number.isNaN(value)) return '--';
  const normalized = inputIsRatio ? value * 100 : value;
  const prefix = normalized > 0 ? '+' : '';
  return `${prefix}${normalized.toFixed(2)}%`;
}

export function dateText(value?: string | null) {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

export function dateTimeText(value?: string | null) {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

export function pnlClass(value?: number | null) {
  if (value === null || value === undefined) return 'text-neutral-600 dark:text-neutral-400';
  if (value > 0) return 'text-green-600 dark:text-green-400';
  if (value < 0) return 'text-red-600 dark:text-red-400';
  return 'text-neutral-600 dark:text-neutral-400';
}

export function statusClass(tone: 'green' | 'red' | 'blue' | 'yellow' | 'gray') {
  const styles = {
    green:
      'border-green-200 bg-green-50 text-green-700 dark:border-green-900/50 dark:bg-green-950/30 dark:text-green-300',
    red:
      'border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300',
    blue:
      'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300',
    yellow:
      'border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-900/50 dark:bg-yellow-950/30 dark:text-yellow-300',
    gray:
      'border-neutral-200 bg-neutral-50 text-neutral-600 dark:border-neutral-800 dark:bg-neutral-950/40 dark:text-neutral-300',
  };

  return styles[tone];
}
