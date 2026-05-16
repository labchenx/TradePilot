import { RecentTradeDto } from '../dto/recent-trade.dto';
import { DashboardEventRow } from './dashboard-calculator.types';
import { toDecimal, toPlainNumber } from './dashboard-decimal.util';
import { convertToDashboardCurrency } from './exchange-rate.util';

/**
 * 负责把最近的买卖交易转换成首页表格需要的字段。
 */
export function calculateRecentTrades(
  trades: DashboardEventRow[],
): RecentTradeDto[] {
  return trades
    .filter((trade) => trade.symbol && trade.side)
    .map((trade) => ({
      date: trade.tradeDate.toISOString().slice(0, 10),
      symbol: trade.symbol as string,
      side: trade.side as 'BUY' | 'SELL',
      quantity: toPlainNumber(toDecimal(trade.absQuantity ?? trade.quantity)),
      price: toPlainNumber(toDecimal(trade.price)),
      amount: toPlainNumber(
        convertToDashboardCurrency(toDecimal(trade.netAmount), trade.currency)
          .amount,
      ),
      commission: toPlainNumber(
        convertToDashboardCurrency(toDecimal(trade.commission), trade.currency)
          .amount,
      ),
    }));
}
