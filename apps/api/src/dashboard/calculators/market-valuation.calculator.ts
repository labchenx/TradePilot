import Decimal from 'decimal.js';
import { MarketQuoteResult } from '../../market-data/quote.types';
import {
  MarketValuationResult,
  PositionCostResult,
} from './dashboard-calculator.types';
import { convertToDashboardCurrency } from './exchange-rate.util';

/**
 * 市值计算器。
 *
 * 它只负责一件事：把当前持仓数量乘以当前行情价格。
 * 行情缺失时不抛错，而是返回 missingQuote 和 warning，让 Summary 决定是否展示 --。
 */
export function calculateMarketValuation(
  positionCost: PositionCostResult,
  quoteResult: MarketQuoteResult,
): MarketValuationResult {
  const warnings = new Set<string>(quoteResult.warnings);

  const items = positionCost.positions
    .filter((position) => position.remainingQuantity.gt(0))
    .map((position) => {
      const quote = quoteResult.quotesBySymbol.get(position.symbol);

      if (!quote) {
        warnings.add(`${position.symbol} 缺少行情，股票市值无法完整计算。`);
        return {
          symbol: position.symbol,
          name: position.symbol,
          quantity: position.remainingQuantity,
          price: null,
          currency: null,
          marketValue: null,
          missingQuote: true,
        };
      }

      const convertedPrice = convertToDashboardCurrency(
        quote.price,
        quote.currency,
      );
      convertedPrice.warnings.forEach((warning) => warnings.add(warning));

      return {
        symbol: position.symbol,
        name: quote.name ?? position.symbol,
        quantity: position.remainingQuantity,
        price: convertedPrice.amount,
        currency: quote.currency,
        providerSymbol: quote.providerSymbol,
        marketValue: position.remainingQuantity.mul(convertedPrice.amount),
        missingQuote: false,
      };
    });

  const hasMissingQuote = items.some((item) => item.missingQuote);
  const stockMarketValue = hasMissingQuote
    ? null
    : items.reduce(
        (sum, item) => sum.plus(item.marketValue ?? new Decimal(0)),
        new Decimal(0),
      );

  return {
    items,
    stockMarketValue,
    hasMissingQuote,
    warnings: Array.from(warnings),
  };
}
