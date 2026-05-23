import { useCallback, useEffect, useState } from 'react';
import { settingsService } from '@/services';
import type { SettingsStatus } from '@/types';

export function useSystemStatus() {
  const [status, setStatus] = useState<SettingsStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setStatus(await settingsService.getStatus());
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'System status request failed.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { status, loading, error, refetch };
}
