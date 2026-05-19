import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import Decimal from 'decimal.js';
import { PrismaService } from '../prisma/prisma.service';
import { normalizeSymbolForYahoo } from './symbol-normalizer';
import { YahooProvider } from './yahoo-provider';

export interface MonthEndPriceResult {
  symbol: string;
  providerSymbol: string;
  date: Date | null;
  close: Decimal | null;
  adjustedClose: Decimal | null;
  currency: string | null;
  source: 'CACHE' | 'YAHOO_FINANCE' | 'MISSING';
  warnings: string[];
}

function toDateOnly(value: Date) {
  return new Date(value.toISOString().slice(0, 10) + 'T00:00:00.000Z');
}

function addDays(value: Date, days: number) {
  const next = new Date(value);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

@Injectable()
export class HistoricalPriceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly yahooProvider: YahooProvider,
  ) {}

  private async findCachedMonthEndPrice(
    symbol: string,
    monthStart: Date,
    snapshotDate: Date,
  ) {
    return this.prisma.priceHistory.findFirst({
      where: {
        symbol,
        date: {
          gte: monthStart,
          lte: snapshotDate,
        },
      },
      orderBy: { date: 'desc' },
    });
  }

  private async saveDailyPrices(
    symbol: string,
    providerSymbol: string,
    prices: Array<{
      date: Date;
      close: number;
      adjustedClose?: number;
      currency: string;
    }>,
  ) {
    await Promise.all(
      prices.map((price) =>
        this.prisma.priceHistory.upsert({
          where: {
            symbol_date_source: {
              symbol,
              date: toDateOnly(price.date),
              source: 'YAHOO_FINANCE',
            },
          },
          update: {
            providerSymbol,
            close: new Prisma.Decimal(price.close),
            adjustedClose:
              typeof price.adjustedClose === 'number'
                ? new Prisma.Decimal(price.adjustedClose)
                : null,
            currency: price.currency,
          },
          create: {
            symbol,
            providerSymbol,
            date: toDateOnly(price.date),
            close: new Prisma.Decimal(price.close),
            adjustedClose:
              typeof price.adjustedClose === 'number'
                ? new Prisma.Decimal(price.adjustedClose)
                : null,
            currency: price.currency,
            source: 'YAHOO_FINANCE',
          },
        }),
      ),
    );
  }

  /**
   * 获取某个月的月末收盘价。
   *
   * 业务层只问“某只股票某个月的月末价格”，这里负责：
   * 1. 先查本地 price_history；
   * 2. 缺失时向 Yahoo 拉取该月日线；
   * 3. 缓存成功返回的数据；
   * 4. 仍然缺失时返回 warning，而不是让 Dashboard 崩溃。
   */
  async getMonthEndClosePrice(
    symbol: string,
    monthStart: Date,
    snapshotDate: Date,
  ): Promise<MonthEndPriceResult> {
    const providerSymbol = normalizeSymbolForYahoo(symbol);
    const warnings: string[] = [];
    const cached = await this.findCachedMonthEndPrice(
      symbol,
      monthStart,
      snapshotDate,
    );

    if (cached) {
      return {
        symbol,
        providerSymbol,
        date: cached.date,
        close: new Decimal(cached.close),
        adjustedClose: cached.adjustedClose
          ? new Decimal(cached.adjustedClose)
          : null,
        currency: cached.currency,
        source: 'CACHE',
        warnings,
      };
    }

    try {
      const prices = await this.yahooProvider.getDailyPrices(
        providerSymbol,
        monthStart,
        addDays(snapshotDate, 1),
      );
      await this.saveDailyPrices(symbol, providerSymbol, prices);
    } catch {
      warnings.push(
        `${symbol} ${monthStart.toISOString().slice(0, 7)} historical price request failed.`,
      );
    }

    const latest = await this.findCachedMonthEndPrice(
      symbol,
      monthStart,
      snapshotDate,
    );

    if (!latest) {
      warnings.push(
        `${symbol} ${monthStart.toISOString().slice(0, 7)} month-end close price is missing.`,
      );

      return {
        symbol,
        providerSymbol,
        date: null,
        close: null,
        adjustedClose: null,
        currency: null,
        source: 'MISSING',
        warnings,
      };
    }

    return {
      symbol,
      providerSymbol,
      date: latest.date,
      close: new Decimal(latest.close),
      adjustedClose: latest.adjustedClose
        ? new Decimal(latest.adjustedClose)
        : null,
      currency: latest.currency,
      source: 'YAHOO_FINANCE',
      warnings,
    };
  }
}
