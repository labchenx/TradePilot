/**
 * Dashboard 本地汇率配置。
 *
 * 当前阶段先手动维护汇率，后续接入汇率 API 时，可以把这个文件替换成
 * ExchangeRateService，从外部服务拉取并缓存 rates。
 *
 * 口径：baseCurrency = USD，rates 表示 1 USD = x currency。
 * 来源：https://open.er-api.com/v6/latest/USD
 * 更新时间：Thu, 14 May 2026 00:02:31 +0000
 */
export const dashboardExchangeRatesConfig = {
  baseCurrency: 'USD',
  source: 'https://open.er-api.com/v6/latest/USD',
  updatedAt: '2026-05-14T00:02:31.000Z',
  rates: {
    USD: 1,
    HKD: 7.830049,
    CNH: 6.789147,
    CNY: 6.805697,
  },
} as const;

export type DashboardSupportedCurrency =
  keyof typeof dashboardExchangeRatesConfig.rates;
