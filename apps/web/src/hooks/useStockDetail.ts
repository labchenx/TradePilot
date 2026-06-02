import { useCallback, useEffect, useState } from 'react';
import { stockDetailService } from '@/services';
import type { StockDetailApiDto, StockDetailTrendRange } from '@/types';

export function useStockDetail(
  symbol: string,
  range: StockDetailTrendRange,
) {
  const [data, setData] = useState<StockDetailApiDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStockDetail = useCallback(async () => {
    if (!symbol) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await stockDetailService.getStockDetail(symbol, range);
      setData(result);
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : 'Stock detail request failed.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [range, symbol]);

  useEffect(() => {
    void fetchStockDetail();
  }, [fetchStockDetail]);

  return {
    data,
    loading,
    error,
    refetch: fetchStockDetail,
  };
}
