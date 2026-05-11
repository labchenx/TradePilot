import { useState } from "react";
import { Plus, SlidersHorizontal, ArrowDownToLine, ArrowUpFromLine, RefreshCcw } from "lucide-react";
import { Button, Input, Tag, StatCard, ProfitLossNumber } from "../components/ui";

const cashFlowsData = [
  { id: 1, date: "2026-04-28", type: "DEPOSIT", amount: 5000.00, currency: "USD", broker: "IBKR", source: "Bank Transfer", note: "Monthly savings" },
  { id: 2, date: "2026-04-15", type: "DIVIDEND", amount: 145.50, currency: "USD", broker: "IBKR", source: "AAPL", note: "Q1 Dividend" },
  { id: 3, date: "2026-04-10", type: "FEE", amount: -15.00, currency: "USD", broker: "IBKR", source: "Market Data", note: "Monthly subscription" },
  { id: 4, date: "2026-03-20", type: "WITHDRAW", amount: -2000.00, currency: "USD", broker: "IBKR", source: "Bank Transfer", note: "Car repair" },
  { id: 5, date: "2026-03-01", type: "DEPOSIT", amount: 10000.00, currency: "USD", broker: "IBKR", source: "Bank Transfer", note: "Bonus" },
  { id: 6, date: "2026-02-15", type: "DIVIDEND", amount: 320.00, currency: "USD", broker: "IBKR", source: "MSFT", note: "Q1 Dividend" },
];

export function CashFlows() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">Cash Flows 资金流水</h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Manage deposits, withdrawals, dividends, and other cash movements</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Cash Flow
        </Button>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Deposit 总入金" 
          value={<span className="text-green-600 dark:text-green-400 font-semibold flex items-center gap-1"><ArrowDownToLine className="w-5 h-5"/>$45,000.00</span>} 
        />
        <StatCard 
          title="Total Withdraw 总出金" 
          value={<span className="text-red-600 dark:text-red-400 font-semibold flex items-center gap-1"><ArrowUpFromLine className="w-5 h-5"/>$10,000.00</span>} 
        />
        <StatCard 
          title="Net Deposit 净入金" 
          value={<ProfitLossNumber amount={35000.00} className="text-2xl" />} 
        />
        <StatCard 
          title="Cash Balance 现金余额" 
          value="$6,140.32" 
        />
      </div>

      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm">
        {/* Filter Bar */}
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex flex-wrap gap-4 items-end bg-neutral-50/50 dark:bg-neutral-900/50 rounded-t-xl">
          <div className="w-36">
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Type</label>
            <select className="flex h-9 w-full rounded-md border border-neutral-300 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-400 dark:border-neutral-800 dark:focus-visible:ring-neutral-500 text-neutral-900 dark:text-neutral-100 [&>option]:text-neutral-900 dark:[&>option]:bg-neutral-900">
              <option value="ALL">All Types</option>
              <option value="DEPOSIT">Deposit</option>
              <option value="WITHDRAW">Withdraw</option>
              <option value="DIVIDEND">Dividend</option>
              <option value="FEE">Fee/Tax</option>
            </select>
          </div>
          
          <div className="w-32">
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Currency</label>
            <select className="flex h-9 w-full rounded-md border border-neutral-300 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-400 dark:border-neutral-800 dark:focus-visible:ring-neutral-500 text-neutral-900 dark:text-neutral-100 [&>option]:text-neutral-900 dark:[&>option]:bg-neutral-900">
              <option value="ALL">All Currencies</option>
              <option value="USD">USD</option>
              <option value="HKD">HKD</option>
              <option value="SGD">SGD</option>
            </select>
          </div>

          <div className="flex-1 min-w-[200px] max-w-xs">
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Date Range</label>
            <Input type="date" className="text-neutral-500" />
          </div>
          
          <div className="flex items-center gap-2 ml-auto">
            <Button variant="ghost" size="sm" className="h-9">
              <RefreshCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
            <Button variant="secondary" size="sm" className="h-9">
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-900/50 uppercase border-b border-neutral-200 dark:border-neutral-800">
              <tr>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Type</th>
                <th className="px-6 py-4 font-medium text-right">Amount</th>
                <th className="px-6 py-4 font-medium">Broker</th>
                <th className="px-6 py-4 font-medium">Source / Ref</th>
                <th className="px-6 py-4 font-medium">Note</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {cashFlowsData.map((flow) => (
                <tr key={flow.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-neutral-600 dark:text-neutral-300">{flow.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {flow.type === "DEPOSIT" && <Tag color="green">DEPOSIT</Tag>}
                    {flow.type === "WITHDRAW" && <Tag color="red">WITHDRAW</Tag>}
                    {flow.type === "DIVIDEND" && <Tag color="blue">DIVIDEND</Tag>}
                    {flow.type === "FEE" && <Tag color="gray">FEE</Tag>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right tabular-nums font-semibold">
                    <ProfitLossNumber amount={flow.amount} /> <span className="text-xs font-normal text-neutral-400 ml-1">{flow.currency}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-neutral-900 dark:text-white font-medium">{flow.broker}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-neutral-600 dark:text-neutral-300">{flow.source}</td>
                  <td className="px-6 py-4 text-neutral-500 dark:text-neutral-400 max-w-[200px] truncate" title={flow.note}>{flow.note}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-xs font-medium mr-3">Edit</button>
                    <button className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-xs font-medium">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
