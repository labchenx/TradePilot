import { cashFlowService } from '@/services';

export function useCashFlows() {
  return cashFlowService.listCashFlows();
}

