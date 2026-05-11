import type { ComponentType } from 'react';
import { AlertTriangle, BrainCircuit, ChevronLeft, ExternalLink, Lightbulb, Search, Target, TrendingDown } from 'lucide-react';
import { Link, useParams } from 'react-router';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Button, CardShell, ProfitLossNumber, Tag } from '@/components/common';
import { mockNews, mockTransactions } from '@/data';
import { holdingService } from '@/services';
import { formatCurrency } from '@/utils';

const priceHistory = [
  { date: 'Oct', price: 105 },
  { date: 'Nov', price: 112 },
  { date: 'Dec', price: 120 },
  { date: 'Jan', price: 135 },
  { date: 'Feb', price: 142 },
  { date: 'Mar', price: 145 },
  { date: 'Apr', price: 150 },
];

export function StockDetailPage() {
  const { symbol = 'AMD' } = useParams<{ symbol: string }>();
  const holding = holdingService.getHolding(symbol);
  const relatedTrades = mockTransactions.filter((trade) => trade.symbol === holding.symbol);
  const relatedNews = mockNews.filter((news) => news.symbol === holding.symbol).slice(0, 3);

  return (
    <div className="space-y-6">
      <div>
        <Link to="/holdings" className="mb-4 inline-flex items-center text-sm text-neutral-500 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white">
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to Positions
        </Link>
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl text-xl font-bold text-white" style={{ backgroundColor: holding.color }}>
              {holding.symbol.charAt(0)}
            </div>
            <div>
              <h2 className="flex items-center gap-3 text-3xl font-bold text-neutral-900 dark:text-white">
                {holding.symbol}
                <Tag color="green">Active Holding</Tag>
              </h2>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{holding.name}</p>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <div className="text-3xl font-bold text-neutral-900 dark:text-white">{formatCurrency(holding.currentPrice)}</div>
            <div className="text-sm font-medium text-green-600 dark:text-green-400">+1.25 (+0.84%)</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Metric label="Market Value" value={formatCurrency(holding.marketValue)} />
        <Metric label="Holding Shares" value={holding.quantity.toString()} />
        <Metric label="Avg Cost" value={formatCurrency(holding.averageCost)} />
        <CardShell className="p-4">
          <p className="mb-1 text-xs text-neutral-500 dark:text-neutral-400">Unrealized P/L</p>
          <ProfitLossNumber amount={holding.unrealizedPnl} percentage={holding.unrealizedPnlPercent} className="text-xl font-bold" />
        </CardShell>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <CardShell className="p-5">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Price Trend 走势</h3>
              <div className="flex rounded-lg bg-neutral-100 p-1 dark:bg-neutral-800">
                {['1M', '3M', '6M', '1Y'].map((range) => (
                  <button
                    key={range}
                    type="button"
                    className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                      range === '6M'
                        ? 'bg-white text-black shadow-sm dark:bg-neutral-900 dark:text-white'
                        : 'text-neutral-500 hover:text-black dark:text-neutral-400 dark:hover:text-white'
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
                    <linearGradient id="stockPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                  <YAxis domain={['auto', 'auto']} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(value: number) => `$${value}`} />
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f9fafb', borderRadius: '8px' }} />
                  <Area type="monotone" dataKey="price" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#stockPrice)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardShell>

          <CardShell className="overflow-hidden">
            <div className="border-b border-neutral-200 p-5 dark:border-neutral-800">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Trade History 交易记录</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-neutral-50 text-xs uppercase text-neutral-500 dark:bg-neutral-900/50 dark:text-neutral-400">
                  <tr>
                    <th className="px-6 py-3 font-medium">Date</th>
                    <th className="px-6 py-3 font-medium">Type</th>
                    <th className="px-6 py-3 text-right font-medium">Quantity</th>
                    <th className="px-6 py-3 text-right font-medium">Price</th>
                    <th className="px-6 py-3 text-right font-medium">Fee</th>
                    <th className="px-6 py-3 text-right font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                  {relatedTrades.map((trade) => (
                    <tr key={trade.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                      <td className="px-6 py-3 text-neutral-600 dark:text-neutral-300">{trade.tradeDate}</td>
                      <td className="px-6 py-3"><Tag color={trade.side === 'BUY' ? 'green' : 'red'}>{trade.side}</Tag></td>
                      <td className="px-6 py-3 text-right font-medium tabular-nums text-neutral-900 dark:text-white">{trade.quantity}</td>
                      <td className="px-6 py-3 text-right tabular-nums text-neutral-600 dark:text-neutral-300">{formatCurrency(trade.price)}</td>
                      <td className="px-6 py-3 text-right tabular-nums text-neutral-500 dark:text-neutral-400">{formatCurrency(trade.fee)}</td>
                      <td className="px-6 py-3 text-right font-medium tabular-nums text-neutral-900 dark:text-white">{formatCurrency(trade.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardShell>
        </div>

        <div className="space-y-6 lg:col-span-1">
          <CardShell className="bg-gradient-to-b from-blue-50 to-white p-5 dark:from-blue-950/20 dark:to-neutral-900">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-blue-900 dark:text-blue-100">
                <BrainCircuit className="h-5 w-5 text-blue-500" />
                AI Summary
              </h3>
              <Button size="sm" variant="secondary" className="h-8 border-0 bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-300">
                Regenerate
              </Button>
            </div>
            <p className="mb-4 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
              This is a static information organization placeholder for {holding.symbol}. It does not constitute investment advice.
            </p>
            <div className="mb-6 space-y-3">
              <Insight icon={Lightbulb} title="Positive Factors" text="Strong portfolio contribution and current momentum in mock data." tone="green" />
              <Insight icon={TrendingDown} title="Negative Factors" text="Monitor valuation and concentration risk before adding exposure." tone="red" />
              <Insight icon={Target} title="Watch Items" text="Review future earnings and import accuracy when backend data is connected." tone="yellow" />
            </div>
            <div className="flex gap-2 rounded-lg bg-blue-100/50 p-3 dark:bg-blue-900/20">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
              <p className="text-xs leading-relaxed text-blue-800 dark:text-blue-300/80">AI summary is for information organization only. 不构成投资建议。</p>
            </div>
          </CardShell>

          <CardShell className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Related News 资讯</h3>
              <Search className="h-4 w-4 text-neutral-400" />
            </div>
            <div className="space-y-4">
              {(relatedNews.length ? relatedNews : mockNews.slice(0, 3)).map((news) => (
                <div key={news.id} className="group">
                  <h4 className="flex gap-2 text-sm font-semibold text-neutral-900 transition-colors group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                    {news.title}
                    <ExternalLink className="mt-1 h-3 w-3 text-neutral-400" />
                  </h4>
                  <div className="mt-1.5 flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                    <span className="font-medium text-neutral-700 dark:text-neutral-300">{news.source}</span>
                    <span>{news.publishedAt}</span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-xs text-neutral-600 dark:text-neutral-400">{news.summary}</p>
                </div>
              ))}
            </div>
          </CardShell>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <CardShell className="p-4">
      <p className="mb-1 text-xs text-neutral-500 dark:text-neutral-400">{label}</p>
      <p className="text-xl font-bold text-neutral-900 dark:text-white">{value}</p>
    </CardShell>
  );
}

function Insight({
  icon: Icon,
  title,
  text,
  tone,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  text: string;
  tone: 'green' | 'red' | 'yellow';
}) {
  const styles = {
    green: 'text-green-700 dark:text-green-400',
    red: 'text-red-700 dark:text-red-400',
    yellow: 'text-yellow-700 dark:text-yellow-400',
  };

  return (
    <div className="flex gap-3 text-sm">
      <Icon className={`h-5 w-5 shrink-0 ${styles[tone]}`} />
      <div>
        <span className={`mb-0.5 block font-semibold ${styles[tone]}`}>{title}</span>
        <span className="text-neutral-600 dark:text-neutral-400">{text}</span>
      </div>
    </div>
  );
}
