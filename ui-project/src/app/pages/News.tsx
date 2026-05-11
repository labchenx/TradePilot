import { useState } from "react";
import { BrainCircuit, CheckSquare, Search, Filter, AlertTriangle, ExternalLink } from "lucide-react";
import { Button, Input, Tag } from "../components/ui";

const newsList = [
  { id: 1, symbol: "AMD", title: "AMD Unveils Next-Gen AI Chips to Challenge Nvidia's Dominance", source: "Reuters", time: "2026-04-28 14:30", summary: "Advanced Micro Devices announced its new lineup of artificial intelligence chips, aiming to capture more market share from current leader Nvidia. The new chips boast significant performance improvements over previous generations." },
  { id: 2, symbol: "AAPL", title: "Apple Reports Strong Services Revenue in Q2", source: "Bloomberg", time: "2026-04-27 16:15", summary: "Apple Inc. reported better-than-expected earnings for its fiscal second quarter, driven largely by robust growth in its Services division, which offset softer iPhone sales in certain regions." },
  { id: 3, symbol: "TSLA", title: "Tesla Misses Delivery Estimates Amid Supply Chain Challenges", source: "CNBC", time: "2026-04-26 09:00", summary: "Tesla Inc. fell short of Wall Street's delivery expectations for the first quarter, citing ongoing supply chain disruptions and unexpected factory downtimes in Shanghai and Berlin." },
  { id: 4, symbol: "NVDA", title: "Nvidia Reaches New All-Time High Following Data Center Earnings", source: "Wall Street Journal", time: "2026-04-25 11:45", summary: "Shares of Nvidia Corporation surged to record levels after the company posted blowout quarterly results, fueled by insatiable demand for its data center GPUs used in artificial intelligence applications." },
  { id: 5, symbol: "MSFT", title: "Microsoft Expands Azure AI Capabilities with New Cloud Regions", source: "TechCrunch", time: "2026-04-24 08:30", summary: "Microsoft announced a significant expansion of its Azure cloud infrastructure, adding three new regions globally specifically optimized for handling intensive AI workloads for enterprise customers." },
  { id: 6, symbol: "AMD", title: "Analyst Upgrades AMD Price Target citing Data Center Growth", source: "Yahoo Finance", time: "2026-04-23 10:10", summary: "A major Wall Street firm upgraded its price target for AMD to $180, highlighting better-than-expected data center revenue and successful integration of recent acquisitions." },
];

export function News() {
  const [selectedNews, setSelectedNews] = useState<number[]>([1, 6]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSummary, setShowSummary] = useState(true);

  const toggleSelection = (id: number) => {
    setSelectedNews(prev => 
      prev.includes(id) ? prev.filter(n => n !== id) : [...prev, id]
    );
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setShowSummary(true);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">News & AI Summary 股票资讯</h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Track news for your portfolio and generate AI summaries</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-neutral-500 dark:text-neutral-400">{selectedNews.length} selected</span>
          <Button 
            onClick={handleGenerate}
            disabled={selectedNews.length === 0 || isGenerating}
            className="bg-indigo-600 hover:bg-indigo-700 text-white border-0"
          >
            {isGenerating ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <BrainCircuit className="w-4 h-4" />
                Generate AI Summary
              </span>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* News List */}
        <div className={`xl:col-span-${showSummary ? '2' : '3'} space-y-4 transition-all duration-300`}>
          {/* Filter Bar */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 shadow-sm flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Search News</label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <Input placeholder="Keywords..." className="pl-9" />
              </div>
            </div>
            
            <div className="w-32">
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Symbol</label>
              <select className="flex h-9 w-full rounded-md border border-neutral-300 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-400 dark:border-neutral-800 dark:focus-visible:ring-neutral-500 text-neutral-900 dark:text-neutral-100 [&>option]:text-neutral-900 dark:[&>option]:bg-neutral-900">
                <option value="ALL">All Holdings</option>
                <option value="AMD">AMD</option>
                <option value="AAPL">AAPL</option>
                <option value="TSLA">TSLA</option>
              </select>
            </div>
            
            <div className="w-36">
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Date Range</label>
              <select className="flex h-9 w-full rounded-md border border-neutral-300 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-400 dark:border-neutral-800 dark:focus-visible:ring-neutral-500 text-neutral-900 dark:text-neutral-100 [&>option]:text-neutral-900 dark:[&>option]:bg-neutral-900">
                <option value="7D">Last 7 Days</option>
                <option value="30D">Last 30 Days</option>
                <option value="3M">Last 3 Months</option>
              </select>
            </div>
            
            <Button variant="outline" size="sm" className="h-9 w-9 p-0">
              <Filter className="w-4 h-4" />
            </Button>
          </div>

          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm divide-y divide-neutral-200 dark:divide-neutral-800">
            {newsList.map((news) => (
              <div 
                key={news.id} 
                className={`p-5 flex gap-4 transition-colors cursor-pointer ${
                  selectedNews.includes(news.id) 
                    ? 'bg-indigo-50/50 dark:bg-indigo-900/10 hover:bg-indigo-50 dark:hover:bg-indigo-900/20' 
                    : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                }`}
                onClick={() => toggleSelection(news.id)}
              >
                <div className="mt-1">
                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                    selectedNews.includes(news.id)
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : 'border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900'
                  }`}>
                    {selectedNews.includes(news.id) && <CheckSquare className="w-3.5 h-3.5" />}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-1.5">
                    <h3 className="text-base font-semibold text-neutral-900 dark:text-white leading-snug group flex gap-2">
                      {news.title}
                      <a href="#" className="opacity-0 group-hover:opacity-100 transition-opacity mt-1" onClick={e => e.stopPropagation()}>
                        <ExternalLink className="w-4 h-4 text-neutral-400 hover:text-indigo-600" />
                      </a>
                    </h3>
                    <Tag color={
                      news.symbol === 'AMD' ? 'green' : 
                      news.symbol === 'AAPL' ? 'blue' : 
                      news.symbol === 'TSLA' ? 'red' : 'yellow'
                    }>{news.symbol}</Tag>
                  </div>
                  
                  <div className="flex items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400 mb-3">
                    <span className="font-medium text-neutral-700 dark:text-neutral-300">{news.source}</span>
                    <span>•</span>
                    <span>{news.time}</span>
                  </div>
                  
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed line-clamp-2">
                    {news.summary}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Summary Panel */}
        {showSummary && (
          <div className="xl:col-span-1">
            <div className="bg-gradient-to-br from-indigo-50/80 to-white dark:from-indigo-950/20 dark:to-neutral-900 border border-indigo-100 dark:border-indigo-900/30 rounded-xl shadow-sm sticky top-6 overflow-hidden">
              <div className="p-5 border-b border-indigo-100 dark:border-indigo-900/30 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm flex items-center justify-between">
                <h3 className="text-lg font-semibold text-indigo-900 dark:text-indigo-100 flex items-center gap-2">
                  <BrainCircuit className="w-5 h-5 text-indigo-500" />
                  Portfolio Insights
                </h3>
                <span className="text-xs font-medium bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded-full">
                  Based on 2 items
                </span>
              </div>
              
              <div className="p-6 space-y-6">
                <div>
                  <h4 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider mb-2">Overall Summary</h4>
                  <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
                    AMD is showing strong momentum driven by the announcement of its next-generation AI chips, aiming to challenge Nvidia's dominance. This product launch is supported by analyst upgrades highlighting better-than-expected data center revenue and successful integration of recent acquisitions, setting a positive outlook for the company's near-term performance.
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-green-50/50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30 rounded-lg p-4">
                    <h4 className="text-sm font-bold text-green-800 dark:text-green-400 mb-2">Positive Factors</h4>
                    <ul className="text-sm text-green-700 dark:text-green-300/80 space-y-2 list-disc list-inside pl-1">
                      <li>Launch of competitive next-gen AI chips targeting Nvidia's market share.</li>
                      <li>Analyst upgrade with a $180 price target.</li>
                      <li>Strong growth in data center revenue stream.</li>
                    </ul>
                  </div>
                  
                  <div className="bg-yellow-50/50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/30 rounded-lg p-4">
                    <h4 className="text-sm font-bold text-yellow-800 dark:text-yellow-400 mb-2">Watch Items</h4>
                    <ul className="text-sm text-yellow-700 dark:text-yellow-300/80 space-y-2 list-disc list-inside pl-1">
                      <li>Market reception and actual benchmarks of the new AI chips vs Nvidia's offerings.</li>
                      <li>Execution risk on capturing data center market share.</li>
                    </ul>
                  </div>
                  
                  <div className="bg-red-50/50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-lg p-4">
                    <h4 className="text-sm font-bold text-red-800 dark:text-red-400 mb-2">Risk Points</h4>
                    <ul className="text-sm text-red-700 dark:text-red-300/80 space-y-2 list-disc list-inside pl-1">
                      <li>Intense competition from established leader Nvidia.</li>
                      <li>Potential supply chain constraints for advanced packaging required for AI chips.</li>
                    </ul>
                  </div>
                </div>
                
                <div className="flex gap-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-4 border border-neutral-200 dark:border-neutral-800">
                  <AlertTriangle className="w-5 h-5 text-neutral-400 shrink-0" />
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                    <strong>Disclaimer:</strong> This AI summary is for information organization only and does not constitute investment advice. Please conduct your own research before making trading decisions. 不构成投资建议。
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
