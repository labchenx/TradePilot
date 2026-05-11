import { useParams, Link } from "react-router";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";
import { ChevronLeft, BrainCircuit, ExternalLink, AlertTriangle, Lightbulb, TrendingDown, Target, Search } from "lucide-react";
import { Button, Tag, ProfitLossNumber } from "../components/ui";

const priceHistory = [
  { date: "Oct", price: 105 },
  { date: "Nov", price: 112 },
  { date: "Dec", price: 120 },
  { date: "Jan", price: 135 },
  { date: "Feb", price: 142 },
  { date: "Mar", price: 145 },
  { date: "Apr", price: 150 },
];

const trades = [
  { id: 1, date: "2026-04-28", type: "BUY", qty: 50, price: 165.20, fee: 1.05, amount: 8260.00 },
  { id: 2, date: "2026-02-10", type: "SELL", qty: 30, price: 140.50, fee: 1.00, amount: 4215.00 },
  { id: 3, date: "2025-11-05", type: "BUY", qty: 60, price: 110.00, fee: 1.20, amount: 6600.00 },
];

const newsList = [
  { id: 1, title: "AMD Unveils Next-Gen AI Chips to Challenge Nvidia's Dominance", source: "Reuters", time: "2 hours ago", summary: "Advanced Micro Devices announced its new lineup of artificial intelligence chips, aiming to capture more market share from current leader Nvidia." },
  { id: 2, title: "Semiconductor Stocks Rally on Strong Demand Forecasts", source: "Bloomberg", time: "5 hours ago", summary: "The broader semiconductor sector saw significant gains following upward revisions in global demand forecasts for the second half of the year." },
  { id: 3, title: "Analyst Upgrades AMD Price Target citing Data Center Growth", source: "CNBC", time: "1 day ago", summary: "A major Wall Street firm upgraded its price target for AMD to $180, highlighting better-than-expected data center revenue." },
];

export function StockDetail() {
  const { symbol } = useParams<{ symbol: string }>();
  const isAMD = symbol === 'AMD' || !symbol; // Default to AMD for demo

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link to="/positions" className="inline-flex items-center text-sm text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors mb-4">
          <ChevronLeft className="w-4 h-4 mr-1" /> Back to Positions
        </Link>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center text-white font-bold text-xl">
              {isAMD ? 'A' : symbol?.charAt(0) || 'A'}
            </div>
            <div>
              <h2 className="text-3xl font-bold text-neutral-900 dark:text-white flex items-center gap-3">
                {isAMD ? 'AMD' : symbol}
                <Tag color="green">Active Holding</Tag>
              </h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                {isAMD ? 'Advanced Micro Devices' : `${symbol} Corporation`}
              </p>
            </div>
          </div>
          
          <div className="flex flex-col items-end">
            <div className="text-3xl font-bold text-neutral-900 dark:text-white">$150.00</div>
            <div className="text-sm font-medium text-green-600 dark:text-green-400 flex items-center gap-1">
              +1.25 (+0.84%)
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4">
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Market Value</p>
          <p className="text-xl font-bold text-neutral-900 dark:text-white">$12,000.00</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4">
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Holding Shares</p>
          <p className="text-xl font-bold text-neutral-900 dark:text-white">80</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4">
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Avg Cost</p>
          <p className="text-xl font-bold text-neutral-900 dark:text-white">$110.50</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4">
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Unrealized P/L</p>
          <ProfitLossNumber amount={3160} percentage={35.75} className="text-xl font-bold" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Price Trend 走势</h3>
              <div className="flex bg-neutral-100 dark:bg-neutral-800 rounded-lg p-1">
                {['1M', '3M', '6M', '1Y'].map((range) => (
                  <button
                    key={range}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                      range === '6M' 
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
                <AreaChart data={priceHistory}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                  <YAxis domain={['auto', 'auto']} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(v) => `$${v}`} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f9fafb', borderRadius: '8px' }}
                    itemStyle={{ color: '#10b981' }}
                    formatter={(value: number) => [`$${value}`, 'Price']}
                  />
                  <Area type="monotone" dataKey="price" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorPrice)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex gap-4 text-xs text-neutral-500 dark:text-neutral-400">
              <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-500"></div> Buy Point</span>
              <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500"></div> Sell Point</span>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm">
            <div className="p-5 border-b border-neutral-200 dark:border-neutral-800">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Trade History 交易记录</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-900/50 uppercase">
                  <tr>
                    <th className="px-6 py-3 font-medium">Date</th>
                    <th className="px-6 py-3 font-medium">Type</th>
                    <th className="px-6 py-3 font-medium text-right">Quantity</th>
                    <th className="px-6 py-3 font-medium text-right">Price</th>
                    <th className="px-6 py-3 font-medium text-right">Fee</th>
                    <th className="px-6 py-3 font-medium text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                  {trades.map((trade) => (
                    <tr key={trade.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                      <td className="px-6 py-3 text-neutral-600 dark:text-neutral-300">{trade.date}</td>
                      <td className="px-6 py-3">
                        <Tag color={trade.type === "BUY" ? "green" : "red"}>{trade.type}</Tag>
                      </td>
                      <td className="px-6 py-3 text-right tabular-nums font-medium text-neutral-900 dark:text-white">{trade.qty}</td>
                      <td className="px-6 py-3 text-right tabular-nums text-neutral-600 dark:text-neutral-300">${trade.price.toFixed(2)}</td>
                      <td className="px-6 py-3 text-right tabular-nums text-neutral-500 dark:text-neutral-400">${trade.fee.toFixed(2)}</td>
                      <td className="px-6 py-3 text-right tabular-nums font-medium text-neutral-900 dark:text-white">${trade.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar News & AI */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-gradient-to-b from-blue-50 to-white dark:from-blue-950/20 dark:to-neutral-900 border border-blue-100 dark:border-blue-900/30 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-blue-500" />
                AI Summary
              </h3>
              <Button size="sm" variant="secondary" className="bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-800/50 border-0 h-8">
                Regenerate
              </Button>
            </div>
            
            <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed mb-4">
              AMD shows strong momentum driven by new AI chip announcements and positive data center growth forecasts. The stock remains in an uptrend but faces resistance near current levels.
            </p>
            
            <div className="space-y-3 mb-6">
              <div className="flex gap-3 text-sm">
                <Lightbulb className="w-5 h-5 text-green-500 shrink-0" />
                <div>
                  <span className="font-semibold text-green-700 dark:text-green-400 block mb-0.5">Positive Factors</span>
                  <span className="text-neutral-600 dark:text-neutral-400">New AI chip lineup, strong data center revenue, analyst upgrades.</span>
                </div>
              </div>
              <div className="flex gap-3 text-sm">
                <TrendingDown className="w-5 h-5 text-red-500 shrink-0" />
                <div>
                  <span className="font-semibold text-red-700 dark:text-red-400 block mb-0.5">Negative Factors</span>
                  <span className="text-neutral-600 dark:text-neutral-400">High valuation multiples, intense competition from Nvidia.</span>
                </div>
              </div>
              <div className="flex gap-3 text-sm">
                <Target className="w-5 h-5 text-yellow-500 shrink-0" />
                <div>
                  <span className="font-semibold text-yellow-700 dark:text-yellow-400 block mb-0.5">Watch Items</span>
                  <span className="text-neutral-600 dark:text-neutral-400">Upcoming earnings call on May 15th, PC market recovery data.</span>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-100/50 dark:bg-blue-900/20 rounded-lg p-3 flex gap-2">
              <AlertTriangle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-800 dark:text-blue-300/80 leading-relaxed">
                AI summary is for information organization only and does not constitute investment advice. 不构成投资建议。
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Related News 资讯</h3>
              <Search className="w-4 h-4 text-neutral-400" />
            </div>
            <div className="space-y-4">
              {newsList.map((news) => (
                <div key={news.id} className="group">
                  <h4 className="text-sm font-semibold text-neutral-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex gap-2">
                    {news.title}
                    <ExternalLink className="w-3 h-3 mt-1 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </h4>
                  <div className="flex items-center gap-2 mt-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                    <span className="font-medium text-neutral-700 dark:text-neutral-300">{news.source}</span>
                    <span>•</span>
                    <span>{news.time}</span>
                  </div>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-2 line-clamp-2">
                    {news.summary}
                  </p>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors font-medium">
              View All News
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
