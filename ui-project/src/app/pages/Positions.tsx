import { useState } from "react";
import { Link } from "react-router";
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie } from "recharts";
import { SlidersHorizontal, ArrowRight } from "lucide-react";
import { Button, Input, Tag, StatCard, ProfitLossNumber } from "../components/ui";

const positionsData = [
  { symbol: "AMD", name: "Advanced Micro Devices", shares: 80, avgCost: 110.50, currentPrice: 150.00, marketValue: 12000, unPnl: 3160, returnPct: 35.75, color: "#10b981" },
  { symbol: "AAPL", name: "Apple Inc.", shares: 60, avgCost: 155.20, currentPrice: 175.00, marketValue: 10500, unPnl: 1188, returnPct: 12.76, color: "#3b82f6" },
  { symbol: "TSLA", name: "Tesla Inc.", shares: 45, avgCost: 205.80, currentPrice: 182.22, marketValue: 8200, unPnl: -1061.1, returnPct: -11.45, color: "#8b5cf6" },
  { symbol: "NVDA", name: "NVIDIA Corp.", shares: 8, avgCost: 550.00, currentPrice: 935.00, marketValue: 7480, unPnl: 3080, returnPct: 70.00, color: "#f59e0b" },
  { symbol: "MSFT", name: "Microsoft Corp.", shares: 10, avgCost: 380.00, currentPrice: 400.00, marketValue: 4000, unPnl: 200, returnPct: 5.26, color: "#6366f1" },
];

const sortedByValue = [...positionsData].sort((a, b) => b.marketValue - a.marketValue);
const sortedByPnl = [...positionsData].sort((a, b) => b.unPnl - a.unPnl);

export function Positions() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">Positions 当前持仓</h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Review current portfolio holdings, cost basis, and unrealized profits</p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Number of Holdings 持仓数" value="5" />
        <StatCard title="Total Market Value 总市值" value="$42,180.20" />
        <StatCard title="Total Cost 总成本" value="$35,613.10" />
        <StatCard 
          title="Unrealized P/L 未实现盈亏" 
          value={<ProfitLossNumber amount={6567.10} percentage={18.44} className="text-2xl" />} 
          trend="up"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-sm lg:col-span-1">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-6">Allocation 持仓占比</h3>
          <div className="h-48 relative">
            <ResponsiveContainer width="100%" height="100%" minHeight={192}>
              <PieChart>
                <Pie
                  data={sortedByValue}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="marketValue"
                  stroke="none"
                >
                  {sortedByValue.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f9fafb', borderRadius: '8px' }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Market Value']}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-lg font-bold text-neutral-900 dark:text-white">$42k</span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">Total Value</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-sm lg:col-span-2">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-6">P/L by Symbol 个股盈亏</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%" minHeight={192}>
              <BarChart data={sortedByPnl}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
                <XAxis dataKey="symbol" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(v) => `$${v/1000}k`} />
                <RechartsTooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f9fafb', borderRadius: '8px' }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'P/L']}
                />
                <Bar dataKey="unPnl" radius={[4, 4, 4, 4]}>
                  {sortedByPnl.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.unPnl >= 0 ? '#10b981' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm">
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center bg-neutral-50/50 dark:bg-neutral-900/50 rounded-t-xl">
          <h3 className="font-semibold text-neutral-900 dark:text-white">Holdings Detail</h3>
          <Button variant="outline" size="sm" className="h-9">
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-900/50 uppercase border-b border-neutral-200 dark:border-neutral-800">
              <tr>
                <th className="px-6 py-4 font-medium">Symbol / Name</th>
                <th className="px-6 py-4 font-medium text-right">Shares</th>
                <th className="px-6 py-4 font-medium text-right">Avg Cost</th>
                <th className="px-6 py-4 font-medium text-right">Mkt Price</th>
                <th className="px-6 py-4 font-medium text-right">Total Cost</th>
                <th className="px-6 py-4 font-medium text-right">Mkt Value</th>
                <th className="px-6 py-4 font-medium text-right">Unrealized P/L</th>
                <th className="px-6 py-4 font-medium text-right">% of Port</th>
                <th className="px-6 py-4 font-medium text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {positionsData.map((pos) => (
                <tr key={pos.symbol} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: pos.color }}></div>
                        {pos.symbol}
                      </span>
                      <span className="text-xs text-neutral-500 dark:text-neutral-400">{pos.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right tabular-nums font-semibold text-neutral-900 dark:text-white">
                    {pos.shares}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right tabular-nums text-neutral-600 dark:text-neutral-300">
                    ${pos.avgCost.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right tabular-nums font-medium text-neutral-900 dark:text-white">
                    ${pos.currentPrice.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right tabular-nums text-neutral-500 dark:text-neutral-400">
                    ${(pos.shares * pos.avgCost).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right tabular-nums font-bold text-neutral-900 dark:text-white">
                    ${pos.marketValue.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <ProfitLossNumber amount={pos.unPnl} percentage={pos.returnPct} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right tabular-nums text-neutral-500 dark:text-neutral-400">
                    {((pos.marketValue / 42180.20) * 100).toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <Link to={`/stock/${pos.symbol}`} className="inline-flex items-center justify-center p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors group-hover:opacity-100 md:opacity-0 focus:opacity-100">
                      <ArrowRight className="w-4 h-4" />
                    </Link>
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
