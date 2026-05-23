import { useCallback, useEffect, useState } from 'react';
import { settingsService } from '@/services';
import type { SymbolMapping, SymbolMappingPayload } from '@/types';

export function useSymbolMappings() {
  const [mappings, setMappings] = useState<SymbolMapping[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async (nextSearch = search) => {
    setLoading(true);
    setError(null);
    try {
      setMappings(await settingsService.listSymbolMappings(nextSearch));
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Symbol mappings request failed.',
      );
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const updateSearch = useCallback((value: string) => {
    setSearch(value);
    void refetch(value);
  }, [refetch]);

  const saveMapping = useCallback(
    async (payload: SymbolMappingPayload, id?: string) => {
      setSavingId(id ?? 'new');
      setError(null);
      try {
        if (id) {
          await settingsService.updateSymbolMapping(id, payload);
        } else {
          await settingsService.createSymbolMapping(payload);
        }
        await refetch();
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : 'Saving symbol mapping failed.',
        );
        throw requestError;
      } finally {
        setSavingId(null);
      }
    },
    [refetch],
  );

  const deleteMapping = useCallback(
    async (id: string) => {
      setSavingId(id);
      setError(null);
      try {
        await settingsService.deleteSymbolMapping(id);
        await refetch();
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : 'Deleting symbol mapping failed.',
        );
      } finally {
        setSavingId(null);
      }
    },
    [refetch],
  );

  return {
    mappings,
    search,
    loading,
    savingId,
    error,
    updateSearch,
    saveMapping,
    deleteMapping,
    refetch,
  };
}
