import { useCallback, useState } from 'react';
import { marketDataService, portfolioMaintenanceService } from '@/services';
import type { MaintenanceResult } from '@/types';

export type MaintenanceActionKey =
  | 'recalculatePositions'
  | 'regenerateMonthlySnapshots'
  | 'recalculateMetrics'
  | 'refreshQuotes'
  | 'backfillHistory';

interface ActionState {
  running: boolean;
  success: boolean;
  error: string | null;
  lastRunAt: string | null;
  warnings: string[];
}

const initialActionState: ActionState = {
  running: false,
  success: false,
  error: null,
  lastRunAt: null,
  warnings: [],
};

const actionRequests: Record<MaintenanceActionKey, () => Promise<MaintenanceResult>> = {
  recalculatePositions: portfolioMaintenanceService.recalculatePositions,
  regenerateMonthlySnapshots:
    portfolioMaintenanceService.regenerateMonthlySnapshots,
  recalculateMetrics: portfolioMaintenanceService.recalculateMetrics,
  refreshQuotes: marketDataService.refreshQuotes,
  backfillHistory: marketDataService.backfillHistory,
};

export function useMaintenanceActions() {
  const [actions, setActions] = useState<Record<MaintenanceActionKey, ActionState>>({
    recalculatePositions: initialActionState,
    regenerateMonthlySnapshots: initialActionState,
    recalculateMetrics: initialActionState,
    refreshQuotes: initialActionState,
    backfillHistory: initialActionState,
  });

  const runAction = useCallback(async (key: MaintenanceActionKey) => {
    setActions((current) => ({
      ...current,
      [key]: {
        ...current[key],
        running: true,
        success: false,
        error: null,
        warnings: [],
      },
    }));

    try {
      const result = await actionRequests[key]();
      setActions((current) => ({
        ...current,
        [key]: {
          running: false,
          success: true,
          error: null,
          lastRunAt: result.runAt ?? new Date().toISOString(),
          warnings: result.warnings ?? [],
        },
      }));
      return result;
    } catch (requestError) {
      setActions((current) => ({
        ...current,
        [key]: {
          ...current[key],
          running: false,
          success: false,
          error:
            requestError instanceof Error
              ? requestError.message
              : 'Maintenance action failed.',
        },
      }));
      return null;
    }
  }, []);

  return { actions, runAction };
}
