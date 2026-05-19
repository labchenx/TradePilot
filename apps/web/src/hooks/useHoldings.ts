import { useCallback, useEffect, useState } from 'react';
import { holdingService } from '@/services';
import type { HoldingsData } from '@/types';

export function useHoldings() {
  const [data, setData] = useState<HoldingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHoldings = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const holdings = await holdingService.listHoldings();
      setData(holdings);
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : 'Holdings data request failed.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchHoldings();
  }, [fetchHoldings]);

  return {
    data,
    loading,
    error,
    refetch: fetchHoldings,
  };
}
