import { useCallback, useEffect, useState } from 'react';
import { behaviorService } from '@/services';
import type {
  TradingBehaviorQuery,
  TradingBehaviorResponse,
} from '@/types';

const defaultQuery: TradingBehaviorQuery = {
  range: 'ALL',
  symbol: '',
};

export function useTradingBehavior() {
  const [query, setQuery] = useState<TradingBehaviorQuery>(defaultQuery);
  const [data, setData] = useState<TradingBehaviorResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTradingBehavior = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await behaviorService.getTradingBehavior(query);
      setData(result);
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : 'Trading Behavior data request failed.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    void fetchTradingBehavior();
  }, [fetchTradingBehavior]);

  const updateQuery = useCallback((patch: Partial<TradingBehaviorQuery>) => {
    setQuery((current) => ({
      ...current,
      ...patch,
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
    refetch: fetchTradingBehavior,
  };
}
