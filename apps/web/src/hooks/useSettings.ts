import { useCallback, useEffect, useState } from 'react';
import { settingsService } from '@/services';
import type {
  EmailSettings,
  EmailSettingsPayload,
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
  const [emailSettings, setEmailSettings] = useState<EmailSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [nextProfile, nextMarketData, nextImportSettings, nextEmailSettings] =
        await Promise.all([
          settingsService.getProfile(),
          settingsService.getMarketData(),
          settingsService.getImportSettings(),
          settingsService.getEmailSettings(),
        ]);
      setProfile(nextProfile);
      setMarketData(nextMarketData);
      setImportSettings(nextImportSettings);
      setEmailSettings(nextEmailSettings);
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

  const saveEmailSettings = useCallback(async (payload: EmailSettingsPayload) => {
    setSaving('emailSettings');
    setSuccess(null);
    setError(null);
    try {
      const updated = await settingsService.updateEmailSettings(payload);
      setEmailSettings(updated);
      setSuccess('Email settings saved.');
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : 'Save failed.',
      );
    } finally {
      setSaving(null);
    }
  }, []);

  const testEmailConnection = useCallback(async () => {
    setSaving('emailTest');
    setSuccess(null);
    setError(null);
    try {
      const updated = await settingsService.testEmailConnection();
      setEmailSettings(updated);
      if (updated.status === 'CONNECTED') {
        setSuccess('Email connection test succeeded.');
      } else {
        setError(
          updated.errorMessage ?? 'Email connection test failed. Please check the authorization code.',
        );
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Connection test failed.',
      );
    } finally {
      setSaving(null);
    }
  }, []);

  const disconnectEmail = useCallback(async () => {
    setSaving('emailDisconnect');
    setSuccess(null);
    setError(null);
    try {
      const updated = await settingsService.disconnectEmail();
      setEmailSettings(updated);
      setSuccess('Email connection disconnected.');
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Disconnect failed.',
      );
    } finally {
      setSaving(null);
    }
  }, []);

  return {
    profile,
    marketData,
    importSettings,
    emailSettings,
    loading,
    saving,
    success,
    error,
    setSuccess,
    setError,
    saveProfile,
    saveMarketData,
    saveImportSettings,
    saveEmailSettings,
    testEmailConnection,
    disconnectEmail,
    refetch,
  };
}
