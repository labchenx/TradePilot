export const EastMoneyMarket = {
  Shenzhen: 0,
  Shanghai: 1,
  US: 105,
  US_NYSE: 106,
  US_ETF: 107,
  HongKong: 116,
} as const;

export type EastMoneyMarket =
  (typeof EastMoneyMarket)[keyof typeof EastMoneyMarket];

export interface EastMoneyProviderSymbol {
  providerSymbol: string;
  market: EastMoneyMarket;
  providerKey: string;
}

const US_ETF_SYMBOLS = new Set(['DIA', 'IVV', 'IWM', 'QQQ', 'SPY', 'VTI', 'VOO']);

/**
 * 把系统里的股票代码转换成东方财富 emst 需要的 symbol + market。
 *
 * Symbol Mapping 可以显式写成 `107:SPY` 这种格式，适合覆盖 ETF / 港股等
 * 自动识别不够确定的情况；没有显式 market 时再走默认规则。
 */
export function normalizeSymbolForEastMoney(symbol: string): EastMoneyProviderSymbol {
  const normalized = symbol.trim().toUpperCase();
  const explicit = parseExplicitProviderSymbol(normalized);

  if (explicit) {
    return explicit;
  }

  const specialSymbol = normalizeSpecialUsSymbol(normalized);
  if (specialSymbol) {
    return specialSymbol;
  }

  const providerSymbol = normalized.replace(/\s+/g, '').replace(/[.-]/g, '');
  const market = inferEastMoneyMarket(providerSymbol);

  return buildProviderSymbol(providerSymbol, market);
}

function parseExplicitProviderSymbol(
  value: string,
): EastMoneyProviderSymbol | null {
  const match = value.match(/^(0|1|105|106|107|116):(.+)$/);
  if (!match) return null;

  const market = Number(match[1]) as EastMoneyMarket;
  const rawProviderSymbol = match[2].trim().toUpperCase();
  const specialSymbol = normalizeSpecialUsSymbol(rawProviderSymbol);
  const providerSymbol = specialSymbol?.providerSymbol ?? rawProviderSymbol;
  if (!providerSymbol) return null;

  return buildProviderSymbol(providerSymbol, market);
}

function normalizeSpecialUsSymbol(
  symbol: string,
): EastMoneyProviderSymbol | null {
  if (/^BRK[\s._-]?B$/.test(symbol)) {
    return buildProviderSymbol('BRK_B', EastMoneyMarket.US_NYSE);
  }

  return null;
}

function inferEastMoneyMarket(symbol: string) {
  if (/^[A-Z]+$/.test(symbol)) {
    return US_ETF_SYMBOLS.has(symbol)
      ? EastMoneyMarket.US_ETF
      : EastMoneyMarket.US;
  }

  if (/^\d{5}$/.test(symbol)) {
    return EastMoneyMarket.HongKong;
  }

  if (/^(5|6|9)\d{5}$/.test(symbol)) {
    return EastMoneyMarket.Shanghai;
  }

  return EastMoneyMarket.Shenzhen;
}

function buildProviderSymbol(
  providerSymbol: string,
  market: EastMoneyMarket,
): EastMoneyProviderSymbol {
  return {
    providerSymbol,
    market,
    providerKey: `${market}:${providerSymbol}`,
  };
}
