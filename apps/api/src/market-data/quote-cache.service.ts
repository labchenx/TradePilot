import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import Decimal from 'decimal.js';
import { PrismaService } from '../prisma/prisma.service';
import { MarketQuote } from './quote.types';

interface QuoteSnapshotInput {
  quote: MarketQuote;
  rawData?: unknown;
}

interface QuoteLookupInput {
  symbol: string;
  providerSymbol: string;
}

function toJsonValue(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined) return undefined;

  // Prisma Json 不能包含 undefined。通过 JSON round-trip 清理第三方返回对象，
  // 这样后续排查行情字段时仍能看到 EastMoney 当时返回了什么。
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

@Injectable()
export class QuoteCacheService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 每次外部行情请求成功后，都落一份快照。
   *
   * 这里不做 upsert 覆盖，因为我们想保留“当时查到的价格”，后续可以扩展成
   * 简单历史价格、行情失败回退、价格来源审计。
   */
  async saveSnapshots(items: QuoteSnapshotInput[]) {
    if (items.length === 0) return;

    await Promise.all(
      items.map(({ quote, rawData }) =>
        this.prisma.marketQuoteSnapshot.create({
          data: {
            symbol: quote.symbol,
            providerSymbol: quote.providerSymbol,
            name: quote.name,
            price: quote.price,
            currency: quote.currency,
            provider: quote.provider,
            rawData: toJsonValue(rawData),
            fetchedAt: quote.fetchedAt,
          },
        }),
      ),
    );
  }

  /**
   * EastMoney 临时失败时，按 symbol 回退到最近一次成功保存的快照。
   * 这可以避免 Dashboard 因第三方接口抖动而把总资产、市值全部显示为 --。
   */
  async getLatestQuotes(symbols: QuoteLookupInput[]) {
    const result = new Map<string, MarketQuote>();

    await Promise.all(
      symbols.map(async ({ symbol, providerSymbol }) => {
        const snapshot =
          (await this.prisma.marketQuoteSnapshot.findFirst({
            where: { symbol, provider: 'EASTMONEY' },
            orderBy: { fetchedAt: 'desc' },
          })) ??
          (await this.prisma.marketQuoteSnapshot.findFirst({
            where: { symbol },
            orderBy: { fetchedAt: 'desc' },
          }));

        if (!snapshot) return;

        result.set(symbol, {
          symbol,
          providerSymbol: snapshot.providerSymbol || providerSymbol,
          name: snapshot.name ?? undefined,
          price: new Decimal(snapshot.price),
          currency: snapshot.currency,
          provider: 'EASTMONEY',
          source: 'CACHE',
          fetchedAt: snapshot.fetchedAt,
        });
      }),
    );

    return result;
  }
}
