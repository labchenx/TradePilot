import { holdingService } from '@/services';

export function useHoldings() {
  return holdingService.listHoldings();
}

