import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DuplicateStrategy,
  IbkrEventType,
  ImportSource,
  MarketDataProvider,
  Prisma,
} from '@prisma/client';
import { calculatePositionCost } from '../dashboard/calculators/position-calculator';
import { deduplicateDashboardEvents } from '../dashboard/calculators/deduplicate-events.util';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateSymbolMappingDto,
  ListSymbolMappingsDto,
  UpdateSymbolMappingDto,
} from './dto/symbol-mapping.dto';
import { UpdateImportSettingsDto } from './dto/update-import-settings.dto';
import { UpdateMarketDataSettingsDto } from './dto/update-market-data-settings.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

const EVENT_ORDER: Prisma.TransactionEventOrderByWithRelationInput[] = [
  { tradeDate: 'asc' },
  { rawRowIndex: 'asc' },
];

const CORPORATE_ACTION_EVENTS: IbkrEventType[] = [
  IbkrEventType.STOCK_GRANT,
  IbkrEventType.STOCK_DIVIDEND,
  IbkrEventType.TRANSFER_IN,
  IbkrEventType.TRANSFER_OUT,
  IbkrEventType.SPLIT,
  IbkrEventType.REVERSE_SPLIT,
  IbkrEventType.ADJUSTMENT,
];

function compactDate(value?: Date | null) {
  return value ? value.toISOString() : null;
}

function normalizeSymbol(value: string) {
  return value.trim().toUpperCase();
}

function normalizeNote(value?: string) {
  const note = value?.trim();
  return note ? note : null;
}

function maxDate(...dates: Array<Date | null | undefined>) {
  const validDates = dates.filter((date): date is Date => Boolean(date));
  if (validDates.length === 0) return null;
  return validDates.reduce((latest, date) =>
    date.getTime() > latest.getTime() ? date : latest,
  );
}

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrCreateUserSettings(userId: string) {
    try {
      return await this.prisma.userSettings.upsert({
        where: { userId },
        update: {},
        create: { userId },
      });
    } catch (error) {
      if (!this.isUniqueError(error)) {
        throw error;
      }

      const settings = await this.prisma.userSettings.findUnique({
        where: { userId },
      });
      if (!settings) {
        throw error;
      }
      return settings;
    }
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: dto.name?.trim() || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    return {
      ...user,
      createdAt: user.createdAt.toISOString(),
    };
  }

  async getStatus(userId: string) {
    const symbols = await this.findUserSymbols(userId);
    const positionsCount = await this.countCurrentPositions(userId);
    const symbolFilter = symbols.length ? { symbol: { in: symbols } } : undefined;

    const [
      tradesCount,
      cashFlowsCount,
      corporateActionsCount,
      importJobsCount,
      importRecordsCount,
      monthlySnapshotsCount,
      positionSnapshotsCount,
      symbolMappingsCount,
      quoteCacheCount,
      priceHistoryCount,
      lastImport,
      lastQuote,
      lastPortfolioSnapshot,
      lastPositionSnapshot,
    ] = await Promise.all([
      this.prisma.transactionEvent.count({ where: { userId, isTrade: true } }),
      this.prisma.cashFlow.count({ where: { userId } }),
      this.prisma.transactionEvent.count({
        where: { userId, eventType: { in: CORPORATE_ACTION_EVENTS } },
      }),
      this.prisma.importJob.count({ where: { userId } }),
      this.prisma.importRecord.count({ where: { userId } }),
      this.prisma.portfolioMonthlySnapshot.count({ where: { userId } }),
      this.prisma.positionMonthlySnapshot.count({ where: { userId } }),
      this.prisma.symbolMapping.count({ where: { userId } }),
      symbols.length
        ? this.prisma.marketQuoteSnapshot.count({ where: symbolFilter })
        : Promise.resolve(0),
      symbols.length
        ? this.prisma.priceHistory.count({ where: symbolFilter })
        : Promise.resolve(0),
      this.prisma.importJob.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true, finishedAt: true },
      }),
      symbols.length
        ? this.prisma.marketQuoteSnapshot.findFirst({
            where: symbolFilter,
            orderBy: { fetchedAt: 'desc' },
            select: { fetchedAt: true },
          })
        : Promise.resolve(null),
      this.prisma.portfolioMonthlySnapshot.findFirst({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        select: { updatedAt: true },
      }),
      this.prisma.positionMonthlySnapshot.findFirst({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        select: { updatedAt: true },
      }),
    ]);

    return {
      tradesCount,
      cashFlowsCount,
      corporateActionsCount,
      positionsCount,
      importJobsCount,
      importRecordsCount,
      monthlySnapshotsCount,
      positionSnapshotsCount,
      symbolMappingsCount,
      quoteCacheCount,
      priceHistoryCount,
      lastImportAt: compactDate(lastImport?.finishedAt ?? lastImport?.createdAt),
      lastQuoteUpdatedAt: compactDate(lastQuote?.fetchedAt),
      lastSnapshotGeneratedAt: compactDate(
        maxDate(lastPortfolioSnapshot?.updatedAt, lastPositionSnapshot?.updatedAt),
      ),
    };
  }

  async getMarketDataSettings(userId: string) {
    const settings = await this.getOrCreateUserSettings(userId);
    const symbols = await this.findUserSymbols(userId);
    const [missingQuoteSymbols, missingHistorySymbols, status] = await Promise.all([
      this.findMissingQuoteSymbols(symbols),
      this.findMissingHistorySymbols(symbols),
      this.getStatus(userId),
    ]);

    return {
      provider: settings.marketDataProvider,
      providerLabel: 'Yahoo Finance',
      enableQuoteCache: settings.enableQuoteCache,
      quoteCacheTtlMinutes: settings.quoteCacheTtlMinutes,
      enableHistoryCache: settings.enableHistoryCache,
      missingQuoteSymbols,
      missingHistorySymbols,
      quoteCacheCount: status.quoteCacheCount,
      priceHistoryCount: status.priceHistoryCount,
      lastQuoteUpdatedAt: status.lastQuoteUpdatedAt,
      warnings: [
        'Yahoo Finance is an unofficial market data source. Temporary failures are reported as warnings and should not break the page.',
      ],
    };
  }

  async updateMarketDataSettings(userId: string, dto: UpdateMarketDataSettingsDto) {
    const settings = await this.prisma.userSettings.upsert({
      where: { userId },
      create: {
        userId,
        marketDataProvider: dto.provider ?? MarketDataProvider.YAHOO_FINANCE,
        enableQuoteCache: dto.enableQuoteCache,
        quoteCacheTtlMinutes: dto.quoteCacheTtlMinutes,
        enableHistoryCache: dto.enableHistoryCache,
      },
      update: {
        marketDataProvider: dto.provider,
        enableQuoteCache: dto.enableQuoteCache,
        quoteCacheTtlMinutes: dto.quoteCacheTtlMinutes,
        enableHistoryCache: dto.enableHistoryCache,
      },
    });

    return {
      provider: settings.marketDataProvider,
      enableQuoteCache: settings.enableQuoteCache,
      quoteCacheTtlMinutes: settings.quoteCacheTtlMinutes,
      enableHistoryCache: settings.enableHistoryCache,
      updatedAt: settings.updatedAt.toISOString(),
      warnings: [
        'Yahoo Finance is an unofficial market data source. Keep fallback and cache warnings visible to users.',
      ],
    };
  }

  async getImportSettings(userId: string) {
    const settings = await this.getOrCreateUserSettings(userId);

    return {
      defaultImportSource: settings.defaultImportSource,
      duplicateStrategy: settings.duplicateStrategy,
      autoRefreshQuotesAfterImport: settings.autoRefreshQuotesAfterImport,
      autoRegenerateSnapshotsAfterImport:
        settings.autoRegenerateSnapshotsAfterImport,
      autoRecalculateMetricsAfterImport:
        settings.autoRecalculateMetricsAfterImport,
      saveRawData: settings.saveRawData,
      updatedAt: settings.updatedAt.toISOString(),
    };
  }

  async updateImportSettings(userId: string, dto: UpdateImportSettingsDto) {
    const settings = await this.prisma.userSettings.upsert({
      where: { userId },
      create: {
        userId,
        defaultImportSource: dto.defaultImportSource ?? ImportSource.IBKR_CSV,
        duplicateStrategy:
          dto.duplicateStrategy ?? DuplicateStrategy.UPDATE_EMPTY_FIELDS,
        autoRefreshQuotesAfterImport: dto.autoRefreshQuotesAfterImport,
        autoRegenerateSnapshotsAfterImport:
          dto.autoRegenerateSnapshotsAfterImport,
        autoRecalculateMetricsAfterImport:
          dto.autoRecalculateMetricsAfterImport,
        saveRawData: dto.saveRawData,
      },
      update: dto,
    });

    return {
      defaultImportSource: settings.defaultImportSource,
      duplicateStrategy: settings.duplicateStrategy,
      autoRefreshQuotesAfterImport: settings.autoRefreshQuotesAfterImport,
      autoRegenerateSnapshotsAfterImport:
        settings.autoRegenerateSnapshotsAfterImport,
      autoRecalculateMetricsAfterImport:
        settings.autoRecalculateMetricsAfterImport,
      saveRawData: settings.saveRawData,
      updatedAt: settings.updatedAt.toISOString(),
    };
  }

  async listSymbolMappings(userId: string, query: ListSymbolMappingsDto) {
    const search = query.search?.trim();
    const mappings = await this.prisma.symbolMapping.findMany({
      where: {
        userId,
        ...(search
          ? {
              OR: [
                { sourceSymbol: { contains: search, mode: 'insensitive' } },
                { targetSymbol: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: [{ provider: 'asc' }, { sourceSymbol: 'asc' }],
    });

    return mappings.map((mapping) => ({
      id: mapping.id,
      sourceSymbol: mapping.sourceSymbol,
      targetSymbol: mapping.targetSymbol,
      provider: mapping.provider,
      note: mapping.note,
      updatedAt: mapping.updatedAt.toISOString(),
    }));
  }

  async createSymbolMapping(userId: string, dto: CreateSymbolMappingDto) {
    try {
      const mapping = await this.prisma.symbolMapping.create({
        data: {
          userId,
          sourceSymbol: normalizeSymbol(dto.sourceSymbol),
          targetSymbol: normalizeSymbol(dto.targetSymbol),
          provider: dto.provider ?? MarketDataProvider.YAHOO_FINANCE,
          note: normalizeNote(dto.note),
        },
      });

      return this.serializeSymbolMapping(mapping);
    } catch (error) {
      if (this.isUniqueError(error)) {
        throw new ConflictException(
          'A mapping for this source symbol and provider already exists.',
        );
      }
      throw error;
    }
  }

  async updateSymbolMapping(
    userId: string,
    id: string,
    dto: UpdateSymbolMappingDto,
  ) {
    await this.ensureSymbolMappingOwner(userId, id);

    try {
      const mapping = await this.prisma.symbolMapping.update({
        where: { id },
        data: {
          sourceSymbol: dto.sourceSymbol
            ? normalizeSymbol(dto.sourceSymbol)
            : undefined,
          targetSymbol: dto.targetSymbol
            ? normalizeSymbol(dto.targetSymbol)
            : undefined,
          provider: dto.provider,
          note: dto.note === undefined ? undefined : normalizeNote(dto.note),
        },
      });

      return this.serializeSymbolMapping(mapping);
    } catch (error) {
      if (this.isUniqueError(error)) {
        throw new ConflictException(
          'A mapping for this source symbol and provider already exists.',
        );
      }
      throw error;
    }
  }

  async deleteSymbolMapping(userId: string, id: string) {
    await this.ensureSymbolMappingOwner(userId, id);
    await this.prisma.symbolMapping.delete({ where: { id } });

    return { success: true, deletedId: id };
  }

  async resolveProviderSymbols(
    userId: string | undefined,
    symbols: string[],
    provider = MarketDataProvider.YAHOO_FINANCE,
  ) {
    const uniqueSymbols = Array.from(
      new Set(symbols.map((symbol) => normalizeSymbol(symbol)).filter(Boolean)),
    );

    if (!userId || uniqueSymbols.length === 0) {
      return new Map<string, string>();
    }

    const mappings = await this.prisma.symbolMapping.findMany({
      where: {
        userId,
        provider,
        sourceSymbol: { in: uniqueSymbols },
      },
      select: { sourceSymbol: true, targetSymbol: true },
    });

    return new Map(
      mappings.map((mapping) => [mapping.sourceSymbol, mapping.targetSymbol]),
    );
  }

  private async findUserSymbols(userId: string) {
    const rows = await this.prisma.transactionEvent.findMany({
      where: { userId, symbol: { not: null } },
      distinct: ['symbol'],
      select: { symbol: true },
    });

    return rows
      .map((row) => row.symbol)
      .filter((symbol): symbol is string => Boolean(symbol))
      .map(normalizeSymbol);
  }

  private async countCurrentPositions(userId: string) {
    const rows = await this.prisma.transactionEvent.findMany({
      where: { userId },
      orderBy: EVENT_ORDER,
    });
    const events = deduplicateDashboardEvents(rows).events;
    const positions = calculatePositionCost(events).positions;
    return positions.filter((position) => position.remainingQuantity.gt(0)).length;
  }

  private async findMissingQuoteSymbols(symbols: string[]) {
    if (symbols.length === 0) return [];
    const snapshots = await this.prisma.marketQuoteSnapshot.findMany({
      where: { symbol: { in: symbols } },
      distinct: ['symbol'],
      select: { symbol: true },
    });
    const existing = new Set(snapshots.map((item) => item.symbol));
    return symbols.filter((symbol) => !existing.has(symbol));
  }

  private async findMissingHistorySymbols(symbols: string[]) {
    if (symbols.length === 0) return [];
    const rows = await this.prisma.priceHistory.findMany({
      where: { symbol: { in: symbols } },
      distinct: ['symbol'],
      select: { symbol: true },
    });
    const existing = new Set(rows.map((item) => item.symbol));
    return symbols.filter((symbol) => !existing.has(symbol));
  }

  private async ensureSymbolMappingOwner(userId: string, id: string) {
    const mapping = await this.prisma.symbolMapping.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!mapping || mapping.userId !== userId) {
      throw new NotFoundException(`Symbol mapping ${id} was not found.`);
    }
  }

  private serializeSymbolMapping(mapping: {
    id: string;
    sourceSymbol: string;
    targetSymbol: string;
    provider: MarketDataProvider;
    note: string | null;
    updatedAt: Date;
  }) {
    return {
      id: mapping.id,
      sourceSymbol: mapping.sourceSymbol,
      targetSymbol: mapping.targetSymbol,
      provider: mapping.provider,
      note: mapping.note,
      updatedAt: mapping.updatedAt.toISOString(),
    };
  }

  private isUniqueError(error: unknown) {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    );
  }
}
