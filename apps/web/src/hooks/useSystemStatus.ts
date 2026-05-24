import { useCallback, useEffect, useState } from 'react';
import { settingsService } from '@/services';
import type { SettingsStatus } from '@/types';
import { DATA_SYNC_STATUS_UPDATED_EVENT } from '@/utils/systemStatusEvents';

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

  useEffect(() => {
    const handleDataSyncStatusUpdated = () => {
      void refetch();
    };

    window.addEventListener(
      DATA_SYNC_STATUS_UPDATED_EVENT,
      handleDataSyncStatusUpdated,
    );
    return () => {
      window.removeEventListener(
        DATA_SYNC_STATUS_UPDATED_EVENT,
        handleDataSyncStatusUpdated,
      );
    };
  }, [refetch]);

  return { status, loading, error, refetch };
}
