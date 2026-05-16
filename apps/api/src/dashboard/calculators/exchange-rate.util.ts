import Decimal from 'decimal.js';
import {
  dashboardExchangeRatesConfig,
  DashboardSupportedCurrency,
} from '../config/exchange-rates.config';

export interface CurrencyConversionResult {
  amount: Decimal;
  warnings: string[];
}

function isSupportedCurrency(
  currency: string,
): currency is DashboardSupportedCurrency {
  return currency in dashboardExchangeRatesConfig.rates;
}

/**
 * 把任意已配置币种金额换算成 USD。
 *
 * 配置中的 rates 是 1 USD = x currency，所以：
 * currency amount -> USD amount = amount / rate
 */
export function convertToDashboardCurrency(
  amount: Decimal,
  currency: string | null | undefined,
): CurrencyConversionResult {
  const normalizedCurrency = currency ?? dashboardExchangeRatesConfig.baseCurrency;

  if (!isSupportedCurrency(normalizedCurrency)) {
    return {
      amount,
      warnings: [
        `缺少 ${normalizedCurrency} 汇率配置，已暂按 1:1 计入 ${dashboardExchangeRatesConfig.baseCurrency}，请补充 exchange-rates.config.ts。`,
      ],
    };
  }

  const rate = new Decimal(dashboardExchangeRatesConfig.rates[normalizedCurrency]);
  return {
    amount: amount.div(rate),
    warnings: [],
  };
}

export function getDashboardExchangeRateConfigSummary() {
  return {
    baseCurrency: dashboardExchangeRatesConfig.baseCurrency,
    source: dashboardExchangeRatesConfig.source,
    updatedAt: dashboardExchangeRatesConfig.updatedAt,
    rates: dashboardExchangeRatesConfig.rates,
  };
}
