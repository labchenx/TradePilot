import type { BrokerSettings, ProfileSettings, ServiceStatus } from '@/types';

export const mockProfileSettings: ProfileSettings = {
  name: 'Demo User',
  email: 'user@tradepilot.com',
};

export const mockBrokerSettings: BrokerSettings = {
  broker: 'IBKR',
  alias: 'Main Portfolio',
  baseCurrency: 'USD',
};

export const mockServiceStatuses: ServiceStatus[] = [
  {
    label: 'Market Data API',
    description: 'Future backend proxy for market quotes',
    connected: true,
  },
  {
    label: 'AI Services API',
    description: 'Future backend-only integration for summaries',
    connected: false,
  },
];

