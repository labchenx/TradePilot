import { useCallback, useEffect, useMemo, useState } from 'react';
import { cashFlowService } from '@/services';
import type {
  CashFlowFiltersState,
  CashFlowsData,
} from '@/types';
import { filterAndSortCashFlows } from '@/utils/cashFlowUtils';

export function useCashFlows() {
  const [data, setData] = useState<CashFlowsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<CashFlowFiltersState>({
    type: 'ALL',
    search: '',
    startDate: '',
    endDate: '',
    minAmount: '',
    maxAmount: '',
    sortBy: 'date',
    sortDirection: 'desc',
  });

  const fetchCashFlows = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Hook 层统一处理请求状态，页面组件只关心 data/loading/error。
      const cashFlows = await cashFlowService.listCashFlows();
      setData(cashFlows);
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : 'Cash flow data request failed.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchCashFlows();
  }, [fetchCashFlows]);

  const visibleItems = useMemo(
    () => filterAndSortCashFlows(data?.items ?? [], filters),
    [data?.items, filters],
  );

  const resetFilters = useCallback(() => {
    setFilters({
      type: 'ALL',
      search: '',
      startDate: '',
      endDate: '',
      minAmount: '',
      maxAmount: '',
      sortBy: 'date',
      sortDirection: 'desc',
    });
  }, []);

  return {
    data,
    items: visibleItems,
    filters,
    loading,
    error,
    setFilters,
    resetFilters,
    refetch: fetchCashFlows,
  };
}
