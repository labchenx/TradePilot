import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';
import { TLSSocket, connect as tlsConnect } from 'tls';
import {
  DuplicateStrategy,
  EmailConnectionStatus,
  EmailProvider,
  EmailScanRange,
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
import { UpdateEmailSettingsDto } from './dto/update-email-settings.dto';
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

const EMAIL_PROVIDER_CONFIG: Record<
  EmailProvider,
  { label: string; imapHost: string; imapPort: number; secure: boolean; emailPattern: RegExp }
> = {
  [EmailProvider.QQ_MAIL]: {
    label: 'QQ 邮箱',
    imapHost: 'imap.qq.com',
    imapPort: 993,
    secure: true,
    emailPattern: /^[^@\s]+@qq\.com$/i,
  },
  [EmailProvider.NETEASE_163]: {
    label: '163 邮箱',
    imapHost: 'imap.163.com',
    imapPort: 993,
    secure: true,
    emailPattern: /^[^@\s]+@163\.com$/i,
  },
};

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

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function getEmailProviderConfig(provider: EmailProvider) {
  const config = EMAIL_PROVIDER_CONFIG[provider];
  if (!config) {
    throw new BadRequestException('Unsupported email provider.');
  }
  return config;
}

function serializeEmailSettings(settings: {
  emailProvider: EmailProvider;
  emailAddress: string | null;
  emailAuthSecretEncrypted: string | null;
  emailConnectionStatus: EmailConnectionStatus;
  emailLastTestAt: Date | null;
  emailLastSyncAt: Date | null;
  emailErrorMessage: string | null;
  emailDefaultScanRange: EmailScanRange;
  emailOnlyIbkrEmails: boolean;
  emailOnlyPdfAttachments: boolean;
  emailMarkAsRead: boolean;
  updatedAt: Date;
}) {
  const config = getEmailProviderConfig(settings.emailProvider);

  return {
    provider: settings.emailProvider,
    providerLabel: config.label,
    email: settings.emailAddress,
    hasAuthSecret: Boolean(settings.emailAuthSecretEncrypted),
    status: settings.emailConnectionStatus,
    lastTestAt: compactDate(settings.emailLastTestAt),
    lastSyncAt: compactDate(settings.emailLastSyncAt),
    errorMessage: settings.emailErrorMessage,
    defaultScanRange: settings.emailDefaultScanRange,
    onlyIbkrEmails: settings.emailOnlyIbkrEmails,
    onlyPdfAttachments: settings.emailOnlyPdfAttachments,
    markAsRead: settings.emailMarkAsRead,
    updatedAt: settings.updatedAt.toISOString(),
  };
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

  async getEmailSettings(userId: string) {
    const settings = await this.getOrCreateUserSettings(userId);
    return serializeEmailSettings(settings);
  }

  async updateEmailSettings(userId: string, dto: UpdateEmailSettingsDto) {
    const providerConfig = getEmailProviderConfig(dto.provider);
    const email = normalizeEmail(dto.email);
    this.assertEmailMatchesProvider(email, dto.provider);

    const authSecretEncrypted = dto.authCode
      ? this.encryptSecret(dto.authCode)
      : undefined;

    const settings = await this.prisma.userSettings.upsert({
      where: { userId },
      create: {
        userId,
        emailProvider: dto.provider,
        emailAddress: email,
        emailImapHost: providerConfig.imapHost,
        emailImapPort: providerConfig.imapPort,
        emailImapSecure: providerConfig.secure,
        emailAuthSecretEncrypted: authSecretEncrypted,
        emailConnectionStatus: EmailConnectionStatus.DISCONNECTED,
        emailErrorMessage: null,
        emailDefaultScanRange: dto.defaultScanRange ?? EmailScanRange.SCAN_3D,
        emailOnlyIbkrEmails: dto.onlyIbkrEmails ?? true,
        emailOnlyPdfAttachments: dto.onlyPdfAttachments ?? true,
        emailMarkAsRead: dto.markAsRead ?? false,
      },
      update: {
        emailProvider: dto.provider,
        emailAddress: email,
        emailImapHost: providerConfig.imapHost,
        emailImapPort: providerConfig.imapPort,
        emailImapSecure: providerConfig.secure,
        ...(authSecretEncrypted
          ? { emailAuthSecretEncrypted: authSecretEncrypted }
          : {}),
        emailDefaultScanRange: dto.defaultScanRange,
        emailOnlyIbkrEmails: dto.onlyIbkrEmails,
        emailOnlyPdfAttachments: dto.onlyPdfAttachments,
        emailMarkAsRead: dto.markAsRead,
        emailErrorMessage: null,
      },
    });

    return serializeEmailSettings(settings);
  }

  async testEmailConnection(userId: string) {
    const settings = await this.getOrCreateUserSettings(userId);
    if (!settings.emailAddress || !settings.emailAuthSecretEncrypted) {
      throw new BadRequestException(
        'Please save an email address and authorization code before testing.',
      );
    }

    const providerConfig = getEmailProviderConfig(settings.emailProvider);
    const authCode = this.decryptSecret(settings.emailAuthSecretEncrypted);

    try {
      await testImapInboxConnection({
        host: providerConfig.imapHost,
        port: providerConfig.imapPort,
        secure: providerConfig.secure,
        email: settings.emailAddress,
        authCode,
      });

      const updated = await this.prisma.userSettings.update({
        where: { userId },
        data: {
          emailImapHost: providerConfig.imapHost,
          emailImapPort: providerConfig.imapPort,
          emailImapSecure: providerConfig.secure,
          emailConnectionStatus: EmailConnectionStatus.CONNECTED,
          emailLastTestAt: new Date(),
          emailErrorMessage: null,
        },
      });

      return serializeEmailSettings(updated);
    } catch (error) {
      const message = sanitizeImapError(error);
      const updated = await this.prisma.userSettings.update({
        where: { userId },
        data: {
          emailConnectionStatus: EmailConnectionStatus.ERROR,
          emailLastTestAt: new Date(),
          emailErrorMessage: message,
        },
      });

      return serializeEmailSettings(updated);
    }
  }

  async disconnectEmail(userId: string) {
    const settings = await this.getOrCreateUserSettings(userId);
    const providerConfig = getEmailProviderConfig(settings.emailProvider);

    const updated = await this.prisma.userSettings.update({
      where: { userId },
      data: {
        emailImapHost: providerConfig.imapHost,
        emailImapPort: providerConfig.imapPort,
        emailImapSecure: providerConfig.secure,
        emailAuthSecretEncrypted: null,
        emailConnectionStatus: EmailConnectionStatus.DISCONNECTED,
        emailErrorMessage: null,
      },
    });

    return serializeEmailSettings(updated);
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

  private assertEmailMatchesProvider(email: string, provider: EmailProvider) {
    const config = getEmailProviderConfig(provider);
    if (!config.emailPattern.test(email)) {
      throw new BadRequestException(
        `${config.label} must use an email address that matches this provider.`,
      );
    }
  }

  private encryptSecret(secret: string) {
    const key = this.getEmailSecretKey();
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([
      cipher.update(secret, 'utf8'),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    return [
      'v1',
      iv.toString('base64url'),
      authTag.toString('base64url'),
      encrypted.toString('base64url'),
    ].join(':');
  }

  private decryptSecret(encryptedSecret: string) {
    const [version, iv, authTag, encrypted] = encryptedSecret.split(':');
    if (version !== 'v1' || !iv || !authTag || !encrypted) {
      throw new InternalServerErrorException('Email secret format is invalid.');
    }

    try {
      const key = this.getEmailSecretKey();
      const decipher = createDecipheriv(
        'aes-256-gcm',
        key,
        Buffer.from(iv, 'base64url'),
      );
      decipher.setAuthTag(Buffer.from(authTag, 'base64url'));

      return Buffer.concat([
        decipher.update(Buffer.from(encrypted, 'base64url')),
        decipher.final(),
      ]).toString('utf8');
    } catch {
      throw new BadRequestException(
        'Email auth code cannot be decrypted with the current EMAIL_SECRET_KEY. Please re-save the email auth code in Settings.',
      );
    }
  }

  private getEmailSecretKey() {
    const secret = process.env.EMAIL_SECRET_KEY;
    if (!secret) {
      throw new InternalServerErrorException(
        'EMAIL_SECRET_KEY is not configured.',
      );
    }

    // Hashing allows local/dev secrets of any length while still giving AES a 32-byte key.
    return createHash('sha256').update(secret).digest();
  }

  private isUniqueError(error: unknown) {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    );
  }
}

function quoteImapString(value: string) {
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function sanitizeImapError(error: unknown) {
  if (!(error instanceof Error)) return 'Email connection test failed.';
  return error.message.replace(/AUTHENTICATE|LOGIN/gi, 'AUTH');
}

async function testImapInboxConnection(input: {
  host: string;
  port: number;
  secure: boolean;
  email: string;
  authCode: string;
}) {
  if (!input.secure) {
    throw new BadRequestException('Only secure IMAP connections are supported.');
  }

  const socket = await openTlsSocket(input.host, input.port);
  const reader = new ImapLineReader(socket);

  try {
    await reader.readGreeting();
    await reader.runTaggedCommand(
      'A001',
      `LOGIN ${quoteImapString(input.email)} ${quoteImapString(input.authCode)}`,
    );
    await reader.runTaggedCommand('A002', 'EXAMINE INBOX');
    await reader.runTaggedCommand('A003', 'LOGOUT', true);
  } finally {
    socket.destroy();
  }
}

function openTlsSocket(host: string, port: number) {
  return new Promise<TLSSocket>((resolve, reject) => {
    const socket = tlsConnect({
      host,
      port,
      servername: host,
      timeout: 15000,
    });

    socket.once('secureConnect', () => resolve(socket));
    socket.once('error', reject);
    socket.once('timeout', () => {
      socket.destroy();
      reject(new Error('Email connection timed out.'));
    });
  });
}

class ImapLineReader {
  private buffer = '';
  private lines: string[] = [];
  private waiters: Array<(line: string) => void> = [];

  constructor(private readonly socket: TLSSocket) {
    socket.on('data', (chunk: Buffer) => {
      this.buffer += chunk.toString('utf8');
      let newlineIndex = this.buffer.indexOf('\n');

      while (newlineIndex >= 0) {
        const line = this.buffer.slice(0, newlineIndex).replace(/\r$/, '');
        this.buffer = this.buffer.slice(newlineIndex + 1);
        this.pushLine(line);
        newlineIndex = this.buffer.indexOf('\n');
      }
    });
  }

  async readGreeting() {
    const line = await this.nextLine();
    if (!line.startsWith('* OK') && !line.startsWith('* PREAUTH')) {
      throw new Error('IMAP server did not return a valid greeting.');
    }
  }

  async runTaggedCommand(tag: string, command: string, ignoreFailure = false) {
    this.socket.write(`${tag} ${command}\r\n`);

    while (true) {
      const line = await this.nextLine();
      if (!line.startsWith(`${tag} `)) continue;

      if (line.startsWith(`${tag} OK`)) return;
      if (ignoreFailure) return;
      throw new Error('IMAP server rejected the connection test command.');
    }
  }

  private nextLine() {
    const current = this.lines.shift();
    if (current !== undefined) return Promise.resolve(current);

    return new Promise<string>((resolve) => {
      this.waiters.push(resolve);
    });
  }

  private pushLine(line: string) {
    const waiter = this.waiters.shift();
    if (waiter) {
      waiter(line);
      return;
    }

    this.lines.push(line);
  }
}
