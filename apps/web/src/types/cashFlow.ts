export type CashFlowType = 'DEPOSIT' | 'WITHDRAW' | 'DIVIDEND' | 'FEE';

export interface CashFlow {
  id: string;
  flowDate: string;
  type: CashFlowType;
  amount: number;
  currency: string;
  broker: string;
  source: string;
  note: string;
}

