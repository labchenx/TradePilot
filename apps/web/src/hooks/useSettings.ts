import { useCallback, useEffect, useState } from 'react';
import { settingsService } from '@/services';
import type {
  ImportSettings,
  MarketDataSettings,
  SettingsProfile,
} from '@/types';

export function useSettings() {
  const [profile, setProfile] = useState<SettingsProfile | null>(null);
  const [marketData, setMarketData] = useState<MarketDataSettings | null>(null);
  const [importSettings, setImportSettings] = useState<ImportSettings | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [nextProfile, nextMarketData, nextImportSettings] =
        await Promise.all([
          settingsService.getProfile(),
          settingsService.getMarketData(),
          settingsService.getImportSettings(),
        ]);
      setProfile(nextProfile);
      setMarketData(nextMarketData);
      setImportSettings(nextImportSettings);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Settings request failed.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const saveProfile = useCallback(async (name: string) => {
    setSaving('profile');
    setSuccess(null);
    setError(null);
    try {
      const updated = await settingsService.updateProfile(name);
      setProfile(updated);
      setSuccess('Profile saved.');
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : 'Save failed.',
      );
    } finally {
      setSaving(null);
    }
  }, []);

  const saveMarketData = useCallback(async (payload: MarketDataSettings) => {
    setSaving('marketData');
    setSuccess(null);
    setError(null);
    try {
      const updated = await settingsService.updateMarketData({
        provider: payload.provider,
        enableQuoteCache: payload.enableQuoteCache,
        quoteCacheTtlMinutes: payload.quoteCacheTtlMinutes,
        enableHistoryCache: payload.enableHistoryCache,
      });
      setMarketData({ ...payload, ...updated });
      setSuccess('Market data settings saved.');
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : 'Save failed.',
      );
    } finally {
      setSaving(null);
    }
  }, []);

  const saveImportSettings = useCallback(async (payload: ImportSettings) => {
    setSaving('importSettings');
    setSuccess(null);
    setError(null);
    try {
      const updated = await settingsService.updateImportSettings(payload);
      setImportSettings(updated);
      setSuccess('Import settings saved.');
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : 'Save failed.',
      );
    } finally {
      setSaving(null);
    }
  }, []);

  return {
    profile,
    marketData,
    importSettings,
    loading,
    saving,
    success,
    error,
    setSuccess,
    setError,
    saveProfile,
    saveMarketData,
    saveImportSettings,
    refetch,
  };
}
