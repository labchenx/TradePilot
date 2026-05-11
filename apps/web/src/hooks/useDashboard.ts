import { dashboardService } from '@/services';

export function useDashboard() {
  return dashboardService.getDashboard();
}

