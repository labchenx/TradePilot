import { transactionService } from '@/services';

export function useTransactions() {
  return transactionService.listTransactions();
}

