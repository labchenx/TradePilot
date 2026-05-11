import { Plus } from 'lucide-react';
import { Button, PageTitle } from '@/components/common';
import { CashFlowSummary, CashFlowTable } from '@/components/cash-flow';
import { useCashFlows } from '@/hooks';

export function CashFlowPage() {
  const cashFlows = useCashFlows();

  return (
    <div className="space-y-6">
      <PageTitle
        title="Cash Flows 资金流水"
        description="Manage deposits, withdrawals, dividends, and other cash movements"
        actions={
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Cash Flow
          </Button>
        }
      />
      <CashFlowSummary cashFlows={cashFlows} />
      <CashFlowTable cashFlows={cashFlows} />
    </div>
  );
}

