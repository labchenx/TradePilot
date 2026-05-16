import { useCallback, useEffect, useState } from 'react';
import { dashboardService } from '@/services';
import type { AssetTrendRange, DashboardData } from '@/types';

export function useDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [assetTrendLoading, setAssetTrendLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assetTrendError, setAssetTrendError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    setAssetTrendError(null);

    try {
      // Hook 层负责请求状态，页面组件只消费 data/loading/error。
      const dashboard = await dashboardService.getDashboard();
      setData(dashboard);
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : 'Dashboard data request failed.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchDashboard();
  }, [fetchDashboard]);

  const refetchAssetTrend = useCallback(async (range: AssetTrendRange) => {
    setAssetTrendLoading(true);
    setAssetTrendError(null);

    try {
      // 资产趋势的时间切换只刷新图表数据，避免整个 Dashboard 重新请求和闪烁。
      const performance = await dashboardService.getAssetTrend(range);
      setData((currentData) =>
        currentData ? { ...currentData, performance } : currentData,
      );
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : 'Asset trend request failed.';
      setAssetTrendError(message);
    } finally {
      setAssetTrendLoading(false);
    }
  }, []);

  return {
    data,
    loading,
    assetTrendLoading,
    error,
    assetTrendError,
    refetch: fetchDashboard,
    refetchAssetTrend,
  };
}
