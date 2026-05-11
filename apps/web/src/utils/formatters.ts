export function formatCurrency(value: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPercent(value: number) {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

export function formatDate(value: string) {
  return value;
}

export function getPnLColorClass(value: number) {
  if (value > 0) return 'text-green-600 dark:text-green-400';
  if (value < 0) return 'text-red-600 dark:text-red-400';
  return 'text-neutral-600 dark:text-neutral-400';
}

export function formatCompactCurrency(value: number) {
  if (Math.abs(value) >= 1000) {
    return `$${Math.round(value / 1000)}k`;
  }

  return formatCurrency(value);
}

