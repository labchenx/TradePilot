import { useCallback, useEffect, useState } from 'react';
import { performanceService } from '@/services';
import type { PortfolioAnalyticsResponse } from '@/types/performance';

export function usePerformance() {
  const [data, setData] = useState<PortfolioAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPerformance = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const performance = await performanceService.getPerformance();
      setData(performance);
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : 'Performance data request failed.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchPerformance();
  }, [fetchPerformance]);

  return {
    data,
    loading,
    error,
    refetch: fetchPerformance,
  };
}
