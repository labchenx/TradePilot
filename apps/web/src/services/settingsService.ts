import { mockBrokerSettings, mockProfileSettings, mockServiceStatuses } from '@/data';

export const settingsService = {
  getSettings() {
    // TODO: Replace mock preferences with persisted settings after auth/settings APIs exist.
    return {
      profile: mockProfileSettings,
      broker: mockBrokerSettings,
      services: mockServiceStatuses,
    };
  },
};

