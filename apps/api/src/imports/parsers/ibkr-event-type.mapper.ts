import { IbkrEventType, TradeSide } from './transaction-event.types';

const IBKR_EVENT_TYPE_MAP: Record<string, IbkrEventType> = {
  买: 'TRADE_BUY',
  卖: 'TRADE_SELL',
  存款: 'DEPOSIT',
  取款: 'WITHDRAWAL',
  股息: 'DIVIDEND',
  替代支付: 'PAYMENT_IN_LIEU',
  外国预扣税: 'WITHHOLDING_TAX',
  借方利息: 'DEBIT_INTEREST',
  其它费用: 'OTHER_FEE',
  外汇交易组成部分: 'FX_COMPONENT',
  调整: 'ADJUSTMENT',
};

export function mapIbkrTypeToEventType(ibkrType: string): IbkrEventType {
  return IBKR_EVENT_TYPE_MAP[ibkrType] ?? 'UNKNOWN';
}

export function deriveSide(eventType: IbkrEventType): TradeSide | undefined {
  if (eventType === 'TRADE_BUY') {
    return 'BUY';
  }

  if (eventType === 'TRADE_SELL') {
    return 'SELL';
  }

  return undefined;
}

