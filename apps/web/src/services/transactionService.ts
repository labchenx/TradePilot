import { mockTransactions } from '@/data';

export const transactionService = {
  listTransactions() {
    // TODO: Replace mock data with GET /trades once the backend endpoint is ready.
    return mockTransactions;
  },
};

