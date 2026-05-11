import { useState } from 'react';
import { AlertTriangle, BrainCircuit, CheckSquare, ExternalLink, Filter, Search } from 'lucide-react';
import { Button, CardShell, Input, PageTitle, Tag } from '@/components/common';
import { newsService } from '@/services';

export function NewsPage() {
  const newsList = newsService.listNews();
  const summary = newsService.getAiSummary();
  const [selectedNews, setSelectedNews] = useState<string[]>(['news-1', 'news-5']);
  const [isGenerating, setIsGenerating] = useState(false);

  const toggleSelection = (id: string) => {
    setSelectedNews((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    window.setTimeout(() => setIsGenerating(false), 800);
  };

  return (
    <div className="space-y-6">
      <PageTitle
        title="News & AI Summary 股票资讯"
        description="Static mock UI for portfolio news and future AI summaries"
        actions={
          <>
            <span className="text-sm text-neutral-500 dark:text-neutral-400">{selectedNews.length} selected</span>
            <Button onClick={handleGenerate} disabled={selectedNews.length === 0 || isGenerating} className="border-0 bg-indigo-600 text-white hover:bg-indigo-700">
              <BrainCircuit className="mr-2 h-4 w-4" />
              {isGenerating ? 'Generating...' : 'Generate AI Summary'}
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <CardShell className="flex flex-wrap items-end gap-4 p-4">
            <div className="min-w-[200px] flex-1">
              <label className="mb-1.5 block text-xs font-medium text-neutral-700 dark:text-neutral-300">Search News</label>
              <div className="relative">
                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <Input placeholder="Keywords..." className="pl-9" />
              </div>
            </div>
            <div className="w-32">
              <label className="mb-1.5 block text-xs font-medium text-neutral-700 dark:text-neutral-300">Symbol</label>
              <select className="flex h-9 w-full rounded-md border border-neutral-300 bg-transparent px-3 py-1 text-sm dark:border-neutral-800 dark:[&>option]:bg-neutral-900">
                <option value="ALL">All Holdings</option>
                <option value="AMD">AMD</option>
                <option value="AAPL">AAPL</option>
                <option value="TSLA">TSLA</option>
              </select>
            </div>
            <Button variant="outline" size="sm" className="h-9 w-9 p-0">
              <Filter className="h-4 w-4" />
            </Button>
          </CardShell>

          <CardShell className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {newsList.map((news) => (
              <button
                type="button"
                key={news.id}
                className={`flex w-full cursor-pointer gap-4 p-5 text-left transition-colors ${
                  selectedNews.includes(news.id)
                    ? 'bg-indigo-50/50 hover:bg-indigo-50 dark:bg-indigo-900/10 dark:hover:bg-indigo-900/20'
                    : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                }`}
                onClick={() => toggleSelection(news.id)}
              >
                <div className="mt-1">
                  <div
                    className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${
                      selectedNews.includes(news.id)
                        ? 'border-indigo-600 bg-indigo-600 text-white'
                        : 'border-neutral-300 bg-white dark:border-neutral-600 dark:bg-neutral-900'
                    }`}
                  >
                    {selectedNews.includes(news.id) ? <CheckSquare className="h-3.5 w-3.5" /> : null}
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1.5 flex items-start justify-between gap-4">
                    <h3 className="flex gap-2 text-base leading-snug font-semibold text-neutral-900 dark:text-white">
                      {news.title}
                      <ExternalLink className="mt-1 h-4 w-4 text-neutral-400" />
                    </h3>
                    <Tag color={news.symbol === 'AMD' ? 'green' : news.symbol === 'AAPL' ? 'blue' : news.symbol === 'TSLA' ? 'red' : 'yellow'}>
                      {news.symbol}
                    </Tag>
                  </div>
                  <div className="mb-3 flex items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400">
                    <span className="font-medium text-neutral-700 dark:text-neutral-300">{news.source}</span>
                    <span>{news.publishedAt}</span>
                  </div>
                  <p className="line-clamp-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">{news.summary}</p>
                </div>
              </button>
            ))}
          </CardShell>
        </div>

        <CardShell className="overflow-hidden bg-gradient-to-br from-indigo-50/80 to-white dark:from-indigo-950/20 dark:to-neutral-900">
          <div className="flex items-center justify-between border-b border-indigo-100 bg-white/50 p-5 backdrop-blur-sm dark:border-indigo-900/30 dark:bg-neutral-900/50">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-indigo-900 dark:text-indigo-100">
              <BrainCircuit className="h-5 w-5 text-indigo-500" />
              Portfolio Insights
            </h3>
            <span className="rounded-full bg-indigo-100 px-2 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
              Based on 2 items
            </span>
          </div>
          <div className="space-y-6 p-6">
            <div>
              <h4 className="mb-2 text-sm font-bold tracking-wider text-neutral-900 uppercase dark:text-white">Overall Summary</h4>
              <p className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">{summary.overallSummary}</p>
            </div>
            <SummaryList title="Positive Factors" items={summary.positiveFactors} tone="green" />
            <SummaryList title="Watch Items" items={summary.watchItems} tone="yellow" />
            <SummaryList title="Risk Points" items={summary.riskPoints} tone="red" />
            <div className="flex gap-3 rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-800/50">
              <AlertTriangle className="h-5 w-5 shrink-0 text-neutral-400" />
              <p className="text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
                <strong>Disclaimer:</strong> This AI summary is for information organization only and does not constitute investment advice. 不构成投资建议。
              </p>
            </div>
          </div>
        </CardShell>
      </div>
    </div>
  );
}

function SummaryList({ title, items, tone }: { title: string; items: string[]; tone: 'green' | 'yellow' | 'red' }) {
  const styles = {
    green: 'border-green-100 bg-green-50/50 text-green-700 dark:border-green-900/30 dark:bg-green-900/10 dark:text-green-300/80',
    yellow: 'border-yellow-100 bg-yellow-50/50 text-yellow-700 dark:border-yellow-900/30 dark:bg-yellow-900/10 dark:text-yellow-300/80',
    red: 'border-red-100 bg-red-50/50 text-red-700 dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-300/80',
  };

  return (
    <div className={`rounded-lg border p-4 ${styles[tone]}`}>
      <h4 className="mb-2 text-sm font-bold">{title}</h4>
      <ul className="list-inside list-disc space-y-2 text-sm">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

