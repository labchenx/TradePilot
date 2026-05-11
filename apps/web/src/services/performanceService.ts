import { mockMonthlyPerformance, mockPerformanceRows } from '@/data';

export const performanceService = {
  getPerformance() {
    // TODO: Replace with portfolio performance APIs after backend calculation is implemented.
    return {
      monthly: mockMonthlyPerformance,
      rows: mockPerformanceRows,
    };
  },
};

