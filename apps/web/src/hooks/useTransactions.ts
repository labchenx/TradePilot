import { useCallback, useEffect, useState } from 'react';
import { transactionService } from '@/services';
import type {
  TransactionListQuery,
  TransactionsResponseApiDto,
} from '@/types';

const defaultQuery: TransactionListQuery = {
  search: '',
  side: 'ALL',
  sortBy: 'date',
  sortDirection: 'desc',
  page: 1,
  pageSize: 50,
};

export function useTransactions() {
  const [query, setQuery] = useState<TransactionListQuery>(defaultQuery);
  const [data, setData] = useState<TransactionsResponseApiDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await transactionService.listTransactions(query);
      setData(result);
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : 'Transactions data request failed.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    void fetchTransactions();
  }, [fetchTransactions]);

  const updateQuery = useCallback((patch: Partial<TransactionListQuery>) => {
    setQuery((current) => ({
      ...current,
      ...patch,
      page: patch.page ?? 1,
    }));
  }, []);

  const resetQuery = useCallback(() => {
    setQuery(defaultQuery);
  }, []);

  return {
    data,
    loading,
    error,
    query,
    updateQuery,
    resetQuery,
    refetch: fetchTransactions,
  };
}
