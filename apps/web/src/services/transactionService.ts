import type {
  PortfolioTransactionApiDto,
  TradeSide,
  TransactionListQuery,
  TransactionsResponseApiDto,
} from '@/types';
import { apiFetch } from './apiClient';

async function requestApi<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await apiFetch(path, init);

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const message =
      typeof body?.message === 'string'
        ? body.message
        : Array.isArray(body?.message)
          ? body.message.join('; ')
          : `Transaction API request failed: ${response.status}`;
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

function buildQueryString(query: TransactionListQuery) {
  const params = new URLSearchParams({
    sortBy: query.sortBy,
    sortDirection: query.sortDirection,
    page: String(query.page),
    pageSize: String(query.pageSize),
  });
  const search = query.search.trim();

  if (search) {
    params.set('search', search);
  }

  if (query.side !== 'ALL') {
    params.set('side', query.side);
  }

  return params.toString();
}

export const transactionService = {
  listTransactions(query: TransactionListQuery) {
    return requestApi<TransactionsResponseApiDto>(
      `/portfolio/transactions?${buildQueryString(query)}`,
    );
  },
  updateTransactionSide(id: string, side: TradeSide) {
    return requestApi<PortfolioTransactionApiDto>(
      `/api/portfolio/transactions/${id}/side`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ side }),
      },
    );
  },
  async exportTransactions(query: TransactionListQuery): Promise<void> {
    const params = new URLSearchParams({
      sortBy: query.sortBy,
      sortDirection: query.sortDirection,
    });
    const search = query.search.trim();

    if (search) {
      params.set('search', search);
    }

    if (query.side !== 'ALL') {
      params.set('side', query.side);
    }

    const response = await apiFetch(
      `/portfolio/transactions/export?${params.toString()}`,
    );

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      const message =
        typeof body?.message === 'string'
          ? body.message
          : `Export failed: ${response.status}`;
      throw new Error(message);
    }

    const blob = await response.blob();
    const contentDisposition = response.headers.get('Content-Disposition');
    const filenameMatch = contentDisposition?.match(/filename="?([^";\n]+)"?/);
    const filename = filenameMatch?.[1] ?? 'tradepilot-transactions.csv';

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  },
};
