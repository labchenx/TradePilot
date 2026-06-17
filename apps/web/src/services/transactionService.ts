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
};
