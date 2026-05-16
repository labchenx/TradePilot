/**
 * 把系统里的股票代码转换成 Yahoo Finance 可识别的代码。
 *
 * 当前只做第一版兼容：美股里常见的 B 类股会写成 BRK B 或 BRK.B，
 * Yahoo Finance 使用 BRK-B。后续如果接更多市场，可以继续在这里扩展。
 */
export function normalizeSymbolForYahoo(symbol: string) {
  return symbol.trim().toUpperCase().replace(/[.\s]+/g, '-');
}

