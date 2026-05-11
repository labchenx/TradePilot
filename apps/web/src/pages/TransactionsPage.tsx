import { Plus, UploadCloud } from 'lucide-react';
import { Button, PageTitle } from '@/components/common';
import { TransactionTable } from '@/components/transactions';
import { useTransactions } from '@/hooks';

export function TransactionsPage() {
  const transactions = useTransactions();

  return (
    <div className="space-y-6">
      <PageTitle
        title="Trades 交易记录"
        description="Manage buy and sell records from manual input or IBKR email import"
        actions={
          <>
            <Button variant="outline">
              <UploadCloud className="mr-2 h-4 w-4" />
              Import from IBKR
            </Button>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Trade
            </Button>
          </>
        }
      />
      <TransactionTable transactions={transactions} />
    </div>
  );
}

