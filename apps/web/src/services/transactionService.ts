import type {
  TransactionListQuery,
  TransactionsResponseApiDto,
} from '@/types';
import { apiFetch } from './apiClient';

async function requestApi<T>(path: string): Promise<T> {
  const response = await apiFetch(path);

  if (!response.ok) {
    throw new Error(`交易明细接口请求失败：${response.status}`);
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
};
