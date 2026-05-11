import { useState } from "react";
import { Search, Plus, UploadCloud, ChevronLeft, ChevronRight, SlidersHorizontal, RefreshCcw } from "lucide-react";
import { Button, Input, Tag } from "../components/ui";

const tradesData = [
  { id: 1, date: "2026-04-28", symbol: "AMD", name: "Advanced Micro Devices", type: "BUY", qty: 50, price: 165.20, fee: 1.05, currency: "USD", amount: 8260.00, source: "EMAIL" },
  { id: 2, date: "2026-04-25", symbol: "TSLA", name: "Tesla Inc.", type: "SELL", qty: 20, price: 180.50, fee: 0.95, currency: "USD", amount: 3610.00, source: "MANUAL" },
  { id: 3, date: "2026-04-22", symbol: "NVDA", name: "NVIDIA Corp.", type: "BUY", qty: 10, price: 850.00, fee: 2.10, currency: "USD", amount: 8500.00, source: "EMAIL" },
  { id: 4, date: "2026-04-18", symbol: "AAPL", name: "Apple Inc.", type: "BUY", qty: 30, price: 172.10, fee: 1.50, currency: "USD", amount: 5163.00, source: "EMAIL" },
  { id: 5, date: "2026-04-10", symbol: "MSFT", name: "Microsoft Corp.", type: "BUY", qty: 15, price: 420.30, fee: 1.20, currency: "USD", amount: 6304.50, source: "EMAIL" },
  { id: 6, date: "2026-04-05", symbol: "AMD", name: "Advanced Micro Devices", type: "SELL", qty: 30, price: 170.80, fee: 1.00, currency: "USD", amount: 5124.00, source: "MANUAL" },
];

export function Trades() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">Trades 交易记录</h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Manage buy and sell records from manual input or IBKR email import</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <UploadCloud className="w-4 h-4 mr-2" />
            Import from IBKR
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Trade
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm">
        {/* Filter Bar */}
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex flex-wrap gap-4 items-end bg-neutral-50/50 dark:bg-neutral-900/50 rounded-t-xl">
          <div className="flex-1 min-w-[200px] max-w-xs">
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Search Symbol</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <Input placeholder="e.g. AAPL" className="pl-9" />
            </div>
          </div>
          
          <div className="w-32">
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Type</label>
            <select className="flex h-9 w-full rounded-md border border-neutral-300 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-400 dark:border-neutral-800 dark:focus-visible:ring-neutral-500 text-neutral-900 dark:text-neutral-100 [&>option]:text-neutral-900 dark:[&>option]:bg-neutral-900">
              <option value="ALL">All Types</option>
              <option value="BUY">BUY</option>
              <option value="SELL">SELL</option>
            </select>
          </div>
          
          <div className="w-36">
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Source</label>
            <select className="flex h-9 w-full rounded-md border border-neutral-300 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-400 dark:border-neutral-800 dark:focus-visible:ring-neutral-500 text-neutral-900 dark:text-neutral-100 [&>option]:text-neutral-900 dark:[&>option]:bg-neutral-900">
              <option value="ALL">All Sources</option>
              <option value="EMAIL">Email Import</option>
              <option value="MANUAL">Manual Input</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2 ml-auto">
            <Button variant="ghost" size="sm" className="h-9">
              <RefreshCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
            <Button variant="secondary" size="sm" className="h-9">
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              More Filters
            </Button>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-900/50 uppercase border-b border-neutral-200 dark:border-neutral-800">
              <tr>
                <th className="px-6 py-4 font-medium">Trade Date</th>
                <th className="px-6 py-4 font-medium">Symbol / Name</th>
                <th className="px-6 py-4 font-medium">Type</th>
                <th className="px-6 py-4 font-medium text-right">Quantity</th>
                <th className="px-6 py-4 font-medium text-right">Price</th>
                <th className="px-6 py-4 font-medium text-right">Fee</th>
                <th className="px-6 py-4 font-medium text-right">Amount</th>
                <th className="px-6 py-4 font-medium text-center">Source</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {tradesData.map((trade) => (
                <tr key={trade.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-neutral-600 dark:text-neutral-300">{trade.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="font-bold text-neutral-900 dark:text-white">{trade.symbol}</span>
                      <span className="text-xs text-neutral-500 dark:text-neutral-400">{trade.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Tag color={trade.type === "BUY" ? "green" : "red"}>{trade.type}</Tag>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right tabular-nums font-medium text-neutral-900 dark:text-white">
                    {trade.qty}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right tabular-nums text-neutral-900 dark:text-white">
                    ${trade.price.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right tabular-nums text-neutral-500 dark:text-neutral-400">
                    ${trade.fee.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right tabular-nums font-medium text-neutral-900 dark:text-white">
                    ${trade.amount.toFixed(2)} <span className="text-xs text-neutral-400">{trade.currency}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <Tag color={trade.source === "EMAIL" ? "blue" : "gray"}>{trade.source}</Tag>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-xs font-medium mr-3">Edit</button>
                    <button className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-xs font-medium">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="px-6 py-4 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Showing <span className="font-medium text-neutral-900 dark:text-white">1</span> to <span className="font-medium text-neutral-900 dark:text-white">6</span> of <span className="font-medium text-neutral-900 dark:text-white">42</span> results
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-1 text-sm">
              <button className="w-8 h-8 flex items-center justify-center rounded-md bg-neutral-900 text-white dark:bg-white dark:text-black font-medium">1</button>
              <button className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-medium">2</button>
              <button className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-medium">3</button>
              <span className="text-neutral-400 px-1">...</span>
              <button className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-medium">7</button>
            </div>
            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
