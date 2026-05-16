import type {
  AllocationItem,
  AllocationItemApiDto,
  AssetTrendRange,
  AssetTrendPointApiDto,
  DashboardData,
  DashboardStat,
  DashboardSummaryApiDto,
  RealizedPnlBySymbolApiDto,
  RecentTradeApiDto,
  ReturnBreakdownApiDto,
  ReturnBreakdownItem,
} from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

const allocationColors = [
  '#10b981',
  '#3b82f6',
  '#8b5cf6',
  '#f59e0b',
  '#6366f1',
  '#ef4444',
  '#14b8a6',
  '#64748b',
];

async function requestDashboardApi<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`);

  if (!response.ok) {
    throw new Error(`Dashboard API request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

function marketSubtitle(value: number | null) {
  return value === null ? '行情缺失，暂不展示半完整估算' : 'Yahoo Finance quote';
}

function currencySubtitle(summary: DashboardSummaryApiDto) {
  const hasMultipleCurrencies = (summary.currencyBreakdown?.length ?? 0) > 1;

  if (!hasMultipleCurrencies) return undefined;

  return `本地汇率配置换算为 ${summary.exchangeRate?.baseCurrency ?? 'USD'}`;
}

function nullablePositive(value: number | null) {
  return value === null ? undefined : value >= 0;
}

function buildStats(summary: DashboardSummaryApiDto): DashboardStat[] {
  const fxSubtitle = currencySubtitle(summary);

  return [
    {
      label: 'Total Assets 总资产',
      value: summary.totalAssets,
      currency: 'USD',
      subtitle: fxSubtitle ?? marketSubtitle(summary.totalAssets),
    },
    {
      label: 'Stock Market Value 股票市值',
      value: summary.stockMarketValue,
      currency: 'USD',
      subtitle: marketSubtitle(summary.stockMarketValue),
    },
    {
      label: 'Cash Balance 现金余额',
      value: summary.cashBalance,
      currency: 'USD',
      subtitle: fxSubtitle,
    },
    {
      label: 'Net Deposit 净入金',
      value: summary.netDeposit,
      currency: 'USD',
      subtitle: fxSubtitle,
    },
    {
      label: 'Total Return 总收益',
      value: summary.totalReturn ?? summary.totalPnl,
      currency: 'USD',
      positive: nullablePositive(summary.totalReturn ?? summary.totalPnl),
      subtitle: marketSubtitle(summary.totalReturn ?? summary.totalPnl),
    },
    {
      label: 'Return Rate 收益率',
      value: summary.returnRate === null ? null : summary.returnRate * 100,
      percent: true,
      positive: nullablePositive(summary.returnRate),
      subtitle: summary.returnRate === null ? '净入金为 0 或行情缺失' : '简化收益率，非 TWR/MWR',
    },
    {
      label: 'Realized P/L 已实现盈亏',
      value: summary.realizedPnl,
      currency: 'USD',
      positive: summary.realizedPnl >= 0,
      subtitle: 'IBKR realized P/L, FIFO fallback',
    },
    {
      label: 'Realized Net Income 已实现净收益',
      value: summary.realizedNetIncome,
      currency: 'USD',
      positive: summary.realizedNetIncome >= 0,
      subtitle: 'P/L + Dividends - Fees',
    },
  ];
}

function mapAllocation(items: AllocationItemApiDto[]): AllocationItem[] {
  return items.map((item, index) => ({
    symbol: item.symbol,
    name: item.name,
    quantity: item.quantity,
    value: item.value,
    color:
      item.type === 'CASH'
        ? '#94a3b8'
        : allocationColors[index % allocationColors.length],
    isCash: item.type === 'CASH',
    missingQuote: item.missingQuote,
  }));
}

function mapReturnBreakdown(data: ReturnBreakdownApiDto): ReturnBreakdownItem[] {
  return [
    {
      label: 'Realized P/L 已实现盈亏',
      value: data.realizedPnl,
      tone: data.realizedPnl >= 0 ? 'positive' : 'negative',
    },
    {
      label: 'Unrealized P/L 未实现盈亏',
      value: data.unrealizedPnl,
      tone: data.unrealizedPnl === null ? 'neutral' : data.unrealizedPnl >= 0 ? 'positive' : 'negative',
    },
    {
      label: 'Dividends 股息',
      value: data.dividends,
      tone: data.dividends >= 0 ? 'positive' : 'negative',
    },
    {
      label: 'Payment in Lieu 替代支付',
      value: data.paymentInLieu,
      tone: data.paymentInLieu >= 0 ? 'positive' : 'negative',
    },
    {
      label: 'Fees & Taxes 税费利息',
      value: data.feesAndTaxes,
      tone: data.feesAndTaxes >= 0 ? 'positive' : 'negative',
    },
  ];
}

function mapAssetTrend(assetTrend: AssetTrendPointApiDto[]) {
  return assetTrend.map((point) => ({
    date: point.month,
    value: point.totalAssets,
  }));
}

function initialsFromSymbol(symbol: string) {
  return (
    symbol.replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase() ||
    symbol.slice(0, 2).toUpperCase()
  );
}

function mapDashboardData(
  summary: DashboardSummaryApiDto,
  assetTrend: AssetTrendPointApiDto[],
  allocation: AllocationItemApiDto[],
  returnBreakdown: ReturnBreakdownApiDto,
  realizedPnlBySymbol: RealizedPnlBySymbolApiDto[],
  recentTrades: RecentTradeApiDto[],
): DashboardData {
  return {
    warnings: summary.warnings ?? [],
    stats: buildStats(summary),
    performance: mapAssetTrend(assetTrend),
    allocation: mapAllocation(allocation),
    returnBreakdown: mapReturnBreakdown(returnBreakdown),
    realizedPnlBySymbol: realizedPnlBySymbol.map((item) => ({
      symbol: item.symbol,
      initials: initialsFromSymbol(item.symbol),
      remainingQuantity: item.remainingQuantity,
      value: item.realizedPnl,
      returnRate: item.realizedPnlPercent * 100,
    })),
    recentTransactions: recentTrades.map((trade, index) => ({
      id: `${trade.date}-${trade.symbol}-${trade.side}-${index}`,
      tradeDate: trade.date,
      symbol: trade.symbol,
      name: trade.symbol,
      side: trade.side,
      quantity: trade.quantity,
      price: trade.price,
      fee: trade.commission,
      currency: 'USD',
      amount: trade.amount,
      source: 'IBKR_CSV',
    })),
  };
}

export const dashboardService = {
  async getAssetTrend(range: AssetTrendRange = 'ALL') {
    const params = new URLSearchParams({ range });
    const assetTrend = await requestDashboardApi<AssetTrendPointApiDto[]>(
      `/dashboard/asset-trend?${params.toString()}`,
    );

    return mapAssetTrend(assetTrend);
  },

  async getDashboard(): Promise<DashboardData> {
    // 首页由 6 个 Dashboard API 组合而成；页面组件只消费这里映射好的 UI 数据。
    const [
      summary,
      assetTrend,
      allocation,
      returnBreakdown,
      realizedPnlBySymbol,
      recentTrades,
    ] = await Promise.all([
      requestDashboardApi<DashboardSummaryApiDto>('/dashboard/summary'),
      requestDashboardApi<AssetTrendPointApiDto[]>('/dashboard/asset-trend?range=ALL'),
      requestDashboardApi<AllocationItemApiDto[]>('/dashboard/allocation'),
      requestDashboardApi<ReturnBreakdownApiDto>('/dashboard/return-breakdown'),
      requestDashboardApi<RealizedPnlBySymbolApiDto[]>(
        '/dashboard/realized-pnl-by-symbol',
      ),
      requestDashboardApi<RecentTradeApiDto[]>('/dashboard/recent-trades'),
    ]);

    return mapDashboardData(
      summary,
      assetTrend,
      allocation,
      returnBreakdown,
      realizedPnlBySymbol,
      recentTrades,
    );
  },
};
