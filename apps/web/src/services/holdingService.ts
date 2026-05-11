import { mockHoldings } from '@/data';

export const holdingService = {
  listHoldings() {
    // TODO: Replace mock data with GET /positions once the backend endpoint is ready.
    return mockHoldings;
  },
  getHolding(symbol: string) {
    return mockHoldings.find((holding) => holding.symbol === symbol) ?? mockHoldings[0];
  },
};

