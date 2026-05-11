import { mockBehaviorInsights, mockBehaviorMetrics, mockTradingFrequency } from '@/data';

export const behaviorService = {
  getBehavior() {
    // TODO: Replace with derived analytics after transaction history APIs are available.
    return {
      metrics: mockBehaviorMetrics,
      frequency: mockTradingFrequency,
      insights: mockBehaviorInsights,
    };
  },
};

