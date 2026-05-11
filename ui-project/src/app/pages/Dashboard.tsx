import { useState } from "react";
import { 
  Area, 
  AreaChart, 
  CartesianGrid, 
  Cell, 
  Pie, 
  PieChart, 
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis 
} from "recharts";
import { ArrowUpRight, ArrowDownRight, Clock } from "lucide-react";
import { StatCard, ProfitLossNumber, Tag } from "../components/ui";

const performanceData = [
  { date: "Oct", value: 38000 },
  { date: "Nov", value: 41000 },
  { date: "Dec", value: 39500 },
  { date: "Jan", value: 43200 },
  { date: "Feb", value: 46800 },
  { date: "Mar", value: 48320 },
];

const allocationData = [
  { name: "AMD", value: 12000, color: "#10b981" },
  { name: "AAPL", value: 10500, color: "#3b82f6" },
  { name: "TSLA", value: 8200, color: "#8b5cf6" },
  { name: "NVDA", value: 7480, color: "#f59e0b" },
  { name: "MSFT", value: 4000, color: "#6366f1" },
];

const recentTrades = [
  { id: 1, date: "2026-04-28", symbol: "AMD", type: "BUY", qty: 50, price: 165.20, amount: 8260.00 },
  { id: 2, date: "2026-04-25", symbol: "TSLA", type: "SELL", qty: 20, price: 180.50, amount: 3610.00 },
  { id: 3, date: "2026-04-22", symbol: "NVDA", type: "BUY", qty: 10, price: 850.00, amount: 8500.00 },
  { id: 4, date: "2026-04-18", symbol: "AAPL", type: "BUY", qty: 30, price: 172.10, amount: 5163.00 },
];

export function Dashboard() {
  const [timeRange, setTimeRange] = useState("6M");

  return (
    <div className="space-y-6">
      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard title="Total Assets 总资产" value="$48,320.52" />
        <StatCard title="Stock Market Value 股票市值" value="$42,180.20" />
        <StatCard title="Cash Balance 现金余额" value="$6,140.32" />
        <StatCard title="Net Deposit 净入金" value="$35,000.00" />
        <StatCard 
          title="Total P/L 总收益" 
          value={<ProfitLossNumber amount={13320.52} className="text-2xl" />} 
          trend="up"
        />
        <StatCard 
          title="Return Rate 收益率" 
          value={<span className="text-green-600 dark:text-green-400">+38.06%</span>} 
          trend="up"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Asset Trend 资产趋势</h3>
            <div className="flex bg-neutral-100 dark:bg-neutral-800 rounded-lg p-1">
              {['1M', '3M', '6M', '1Y', 'All'].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    timeRange === range 
                      ? "bg-white dark:bg-neutral-900 text-black dark:text-white shadow-sm" 
                      : "text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white"
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%" minHeight={288}>
              <AreaChart data={performanceData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(v) => `$${v/1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f9fafb', borderRadius: '8px' }}
                  itemStyle={{ color: '#10b981' }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Value']}
                />
                <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Allocation */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-6">Allocation 持仓占比</h3>
          <div className="h-48 relative">
            <ResponsiveContainer width="100%" height="100%" minHeight={192}>
              <PieChart>
                <Pie
                  data={allocationData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {allocationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f9fafb', borderRadius: '8px' }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Market Value']}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xs text-neutral-500 dark:text-neutral-400">Total Stocks</span>
              <span className="text-lg font-bold text-neutral-900 dark:text-white">5</span>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {allocationData.map(item => (
              <div key={item.name} className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="font-medium text-neutral-700 dark:text-neutral-300">{item.name}</span>
                </div>
                <span className="text-neutral-500 dark:text-neutral-400">
                  {((item.value / 42180.20) * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Trades */}
        <div className="lg:col-span-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden shadow-sm">
          <div className="p-5 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Recent Trades 最近交易</h3>
            <button className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-900/50 uppercase">
                <tr>
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium">Symbol</th>
                  <th className="px-6 py-3 font-medium">Type</th>
                  <th className="px-6 py-3 font-medium text-right">Qty</th>
                  <th className="px-6 py-3 font-medium text-right">Price</th>
                  <th className="px-6 py-3 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {recentTrades.map((trade) => (
                  <tr key={trade.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                    <td className="px-6 py-4 text-neutral-600 dark:text-neutral-300">{trade.date}</td>
                    <td className="px-6 py-4 font-bold text-neutral-900 dark:text-white">{trade.symbol}</td>
                    <td className="px-6 py-4">
                      <Tag color={trade.type === "BUY" ? "green" : "red"}>{trade.type}</Tag>
                    </td>
                    <td className="px-6 py-4 text-right tabular-nums text-neutral-900 dark:text-white">{trade.qty}</td>
                    <td className="px-6 py-4 text-right tabular-nums text-neutral-900 dark:text-white">${trade.price.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right tabular-nums text-neutral-900 dark:text-white">${trade.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sync Status Card */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">Sync Status 数据同步</h3>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400 mt-0.5">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-900 dark:text-white">Last IBKR Email Import</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Today at 10:45 AM</p>
              </div>
            </div>
            
            <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">Imported Records</p>
                <p className="text-lg font-bold text-neutral-900 dark:text-white mt-1">12</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">Duplicates Skipped</p>
                <p className="text-lg font-bold text-yellow-600 dark:text-yellow-500 mt-1">3</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">Failed Records</p>
                <p className="text-lg font-bold text-red-600 dark:text-red-500 mt-1">0</p>
              </div>
            </div>
            
            <button className="w-full mt-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-lg text-sm font-medium hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">
              Import Now 立即导入
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
