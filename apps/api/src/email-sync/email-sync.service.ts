import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { createDecipheriv, createHash } from 'crypto';
import { PDFParse } from 'pdf-parse';
import { ImapFlow } from 'imapflow';
import type {
  FetchMessageObject,
  MessageAddressObject,
  SearchObject,
  MessageStructureObject,
} from 'imapflow';
import {
  EmailConnectionStatus,
  EmailMessageStatus,
  EmailProvider,
  EmailSyncJobStatus,
  EmailSyncTriggerType,
  Prisma,
} from '@prisma/client';
import { MarketMaintenanceService } from '../market-data/market-maintenance.service';
import { MonthlySnapshotService } from '../portfolio/monthly-snapshot.service';
import { PortfolioAnalyticsService } from '../portfolio/portfolio-analytics.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConfirmEmailImportDto } from './dto/confirm-email-import.dto';
import { ListEmailSyncJobsDto } from './dto/list-email-sync-jobs.dto';
import { SearchIbkrMailsDto } from './dto/search-ibkr-mails.dto';
import {
  ConfirmEmailImportResponse,
  EmailImportAttachmentItem,
  EmailImportMailDiagnostic,
  EmailImportMailItem,
  EmailPdfTradePreview,
  EmailSyncJobHistoryItem,
  RunEmailSyncResponse,
  ScanAndPreviewIbkrMailsResponse,
  SearchIbkrMailsResponse,
} from './email-sync.types';
import {
  ParsedIbkrPdfTrade,
  createEmailPdfTradeSourceHash,
  parseIbkrPdfTrades,
} from './ibkr-pdf-trade-parser';

const IBKR_TRADE_SUBJECT_REGEX =
  /(\d{1,2}\/\d{1,2}\/\d{4}\s*日?交易报告|Daily\s+Trade\s+Report|Trade\s+Report)/i;

const IBKR_FROM_REGEX = /(interactive\s*brokers|interactivebrokers|ibkr)/i;
const IBKR_TRADE_SUBJECT_REGEX_V2 =
  /(\d{2}\/\d{2}\/\d{4}.*\u4ea4\u6613\u62a5\u544a|Daily\s+Trade\s+Report|Trade\s+Report)/i;
const PDF_FILENAME_REGEX = /\.pdf$/i;
const PREFERRED_PDF_NAME_REGEX = /(DailyTradeRep|DailyTradeReport|TradeRep|TradeReport)/i;
const LATEST_UID_FALLBACK_LIMIT = 120;
const MAX_CANDIDATE_UIDS_PER_SCAN = 15;
const MAX_PDF_ATTACHMENTS_TO_PARSE_PER_SCAN = 10;
const IMAP_CONNECTION_TIMEOUT_MS = 15_000;
const IMAP_GREETING_TIMEOUT_MS = 10_000;
const IMAP_SEARCH_TIMEOUT_MS = 20_000;
const IMAP_FETCH_HEADERS_TIMEOUT_MS = 15_000;
const IMAP_FETCH_STRUCTURE_TIMEOUT_MS = 10_000;
const IMAP_SOCKET_TIMEOUT_MS = 20_000;
const IMAP_DOWNLOAD_TIMEOUT_MS = 30_000;
const PDF_TEXT_TIMEOUT_MS = 15_000;
const MAX_PDF_ATTACHMENT_BYTES = 8 * 1024 * 1024;
const EMAIL_AUTO_SYNC_CRON = '0 0 7 * * *';
const EMAIL_AUTO_SYNC_TIME = '07:00';
const EMAIL_AUTO_SYNC_TIMEZONE = process.env.APP_TIMEZONE ?? 'Asia/Shanghai';

const EMAIL_PROVIDER_CONFIG: Record<
  EmailProvider,
  { label: string; imapHost: string; imapPort: number; secure: boolean }
> = {
  [EmailProvider.QQ_MAIL]: {
    label: 'QQ 邮箱',
    imapHost: 'imap.qq.com',
    imapPort: 993,
    secure: true,
  },
  [EmailProvider.NETEASE_163]: {
    label: '163 邮箱',
    imapHost: 'imap.163.com',
    imapPort: 993,
    secure: true,
  },
};

interface PdfAttachmentCandidate {
  part?: string;
  filename: string;
  contentType: string;
  size: number;
}

interface DownloadedPdfAttachment extends EmailImportAttachmentItem {
  content?: Buffer;
}

interface InspectMessageResult {
  mail: EmailImportMailItem;
  trades: EmailPdfTradePreview[];
  warnings: string[];
  parsedAttachmentCount: number;
}

interface ScanMailboxResult extends ScanAndPreviewIbkrMailsResponse {}

interface CandidateUidResult {
  uids: number[];
  totalFound: number;
  strategy: 'targeted' | 'date-range' | 'latest-fallback';
  truncated: boolean;
}

interface EmailImportPersistenceResult {
  importJobId: string;
  insertedRows: Prisma.TransactionEventCreateManyInput[];
  earliestDate?: Date;
  updatedAccountIds: string[];
  response: ConfirmEmailImportResponse;
}

@Injectable()
export class EmailSyncService {
  private readonly logger = new Logger(EmailSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly monthlySnapshotService: MonthlySnapshotService,
    private readonly marketMaintenanceService: MarketMaintenanceService,
    private readonly portfolioAnalyticsService: PortfolioAnalyticsService,
  ) {}

  async searchIbkrMails(
    userId: string,
    dto: SearchIbkrMailsDto,
  ): Promise<SearchIbkrMailsResponse> {
    const result = await this.runScan(userId, dto, { parsePdf: false });

    return {
      scannedCount: result.scannedCount,
      matchedCount: result.matchedCount,
      attachmentCount: result.attachmentCount,
      newCount: result.newCount,
      duplicateCount: result.duplicateCount,
      errorCount: result.errorCount,
      mails: result.mails,
      warnings: result.warnings,
      diagnostics: result.diagnostics,
    };
  }

  async scanAndPreview(
    userId: string,
    dto: SearchIbkrMailsDto,
  ): Promise<ScanAndPreviewIbkrMailsResponse> {
    return this.runScan(userId, dto, { parsePdf: true });
  }

  @Cron(EMAIL_AUTO_SYNC_CRON, { timeZone: EMAIL_AUTO_SYNC_TIMEZONE })
  async runDailyScheduledSync() {
    const accounts = await this.prisma.userSettings.findMany({
      where: {
        emailAutoSyncEnabled: true,
        emailSyncTime: EMAIL_AUTO_SYNC_TIME,
        emailConnectionStatus: EmailConnectionStatus.CONNECTED,
        emailAddress: { not: null },
        emailAuthSecretEncrypted: { not: null },
      },
    });

    for (const account of accounts) {
      try {
        await this.runAccountSync(account, EmailSyncTriggerType.SCHEDULED);
      } catch (error) {
        this.logger.warn(
          `Scheduled email sync failed for user ${account.userId}: ${sanitizeError(error)}`,
        );
      }
    }
  }

  async runNow(userId: string): Promise<RunEmailSyncResponse> {
    const settings = await this.getConnectedEmailSettings(userId);
    return this.runAccountSync(settings, EmailSyncTriggerType.MANUAL);
  }

  async listJobs(
    userId: string,
    query: ListEmailSyncJobsDto,
  ): Promise<EmailSyncJobHistoryItem[]> {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
    const jobs = await this.prisma.emailSyncJob.findMany({
      where: {
        userId,
        triggerType: query.triggerType,
        status: query.status,
      },
      orderBy: { startedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return jobs.map(serializeEmailSyncJob);
  }

  async confirmImport(
    userId: string,
    dto: ConfirmEmailImportDto,
  ): Promise<ConfirmEmailImportResponse> {
    const trades = dto.trades ?? [];
    if (!Array.isArray(trades) || trades.length === 0) {
      throw new BadRequestException('No email PDF trade previews are available to confirm.');
    }

    const result = await this.importEmailTrades(userId, trades);
    await this.runPostImportActions(userId, result);

    return result.response;
  }

  private async getConnectedEmailSettings(userId: string) {
    const settings = await this.prisma.userSettings.findUnique({
      where: { userId },
    });

    if (!settings?.emailAddress || !settings.emailAuthSecretEncrypted) {
      throw new BadRequestException(
        'Please configure an email account in Settings before syncing.',
      );
    }

    if (settings.emailConnectionStatus !== EmailConnectionStatus.CONNECTED) {
      throw new BadRequestException(
        'Email account is not connected. Please test the connection in Settings first.',
      );
    }

    return settings;
  }

  private async runAccountSync(
    settings: Awaited<ReturnType<EmailSyncService['getConnectedEmailSettings']>>,
    triggerType: EmailSyncTriggerType,
  ): Promise<RunEmailSyncResponse> {
    const startedAt = new Date();
    const jobKey =
      triggerType === EmailSyncTriggerType.SCHEDULED
        ? buildScheduledJobKey(settings.userId, settings.id, startedAt)
        : null;

    if (triggerType === EmailSyncTriggerType.SCHEDULED) {
      const runningJob = await this.prisma.emailSyncJob.findFirst({
        where: {
          userId: settings.userId,
          emailAccountId: settings.id,
          triggerType,
          status: {
            in: [EmailSyncJobStatus.PENDING, EmailSyncJobStatus.RUNNING],
          },
          startedAt: {
            gte: startOfTodayInTimezone(startedAt, EMAIL_AUTO_SYNC_TIMEZONE),
          },
        },
        orderBy: { startedAt: 'desc' },
      });

      if (runningJob) {
        return {
          jobId: runningJob.id,
          importJobId: null,
          triggerType,
          status: EmailSyncJobStatus.PARTIAL,
          scannedCount: runningJob.scannedCount,
          matchedCount: runningJob.matchedCount,
          attachmentCount: runningJob.attachmentCount,
          parsedTradeCount: runningJob.parsedTradeCount,
          insertedCount: runningJob.insertedCount,
          duplicateCount: runningJob.duplicateCount,
          errorCount: runningJob.errorCount,
          warnings: ['A scheduled email sync job is already running today.'],
        };
      }
    }

    let job;
    try {
      job = await this.prisma.emailSyncJob.create({
        data: {
          userId: settings.userId,
          emailAccountId: settings.id,
          triggerType,
          jobKey,
          status: EmailSyncJobStatus.RUNNING,
          startedAt,
        },
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        return {
          jobId: null,
          importJobId: null,
          triggerType,
          status: EmailSyncJobStatus.PARTIAL,
          scannedCount: 0,
          matchedCount: 0,
          attachmentCount: 0,
          parsedTradeCount: 0,
          insertedCount: 0,
          duplicateCount: 0,
          errorCount: 0,
          warnings: ['A scheduled email sync job has already been created for today.'],
        };
      }
      throw error;
    }

    const providerConfig = EMAIL_PROVIDER_CONFIG[settings.emailProvider];
    const emailAddress = settings.emailAddress;
    const encryptedSecret = settings.emailAuthSecretEncrypted;
    if (!emailAddress || !encryptedSecret) {
      throw new BadRequestException(
        'Please configure an email account in Settings before syncing.',
      );
    }
    const warnings: string[] = [];

    try {
      const scan = await this.scanMailbox({
        userId: settings.userId,
        emailAccountId: settings.id,
        email: emailAddress,
        authCode: this.decryptSecret(encryptedSecret),
        host: providerConfig.imapHost,
        port: providerConfig.imapPort,
        secure: providerConfig.secure,
        range: scanRangeFromSetting(settings.emailDefaultScanRange),
        parsePdf: true,
        duplicateMode: 'any-record',
      });
      warnings.push(...scan.warnings);

      const importResult =
        scan.trades.length > 0
          ? await this.importEmailTrades(settings.userId, scan.trades)
          : null;
      if (importResult) {
        warnings.push(...importResult.response.warnings);
        const postResult = await this.runPostImportActions(
          settings.userId,
          importResult,
        );
        warnings.push(...postResult.warnings);
      }

      const insertedCount = importResult?.response.insertedCount ?? 0;
      const duplicateCount = Math.max(
        scan.duplicateCount,
        importResult?.response.duplicateCount ?? 0,
      );
      const errorCount = Math.max(
        scan.errorCount,
        importResult?.response.errorCount ?? 0,
      );
      const status =
        errorCount > 0 || warnings.some((warning) => warning.startsWith('Post-import'))
          ? EmailSyncJobStatus.PARTIAL
          : EmailSyncJobStatus.SUCCESS;

      await this.prisma.$transaction([
        this.prisma.emailSyncJob.update({
          where: { id: job.id },
          data: {
            status,
            finishedAt: new Date(),
            scannedCount: scan.scannedCount,
            matchedCount: scan.matchedCount,
            attachmentCount: scan.attachmentCount,
            parsedTradeCount: scan.parsedTradeCount,
            newCount: scan.newCount,
            insertedCount,
            duplicateCount,
            errorCount,
            warnings: warnings as unknown as Prisma.InputJsonValue,
          },
        }),
        this.prisma.userSettings.update({
          where: { userId: settings.userId },
          data: {
            emailLastSyncAt: new Date(),
            emailLastSyncStatus: status,
            emailLastSyncErrorMessage: null,
            emailErrorMessage: null,
          },
        }),
      ]);

      return {
        jobId: job.id,
        importJobId: importResult?.importJobId ?? null,
        triggerType,
        status,
        scannedCount: scan.scannedCount,
        matchedCount: scan.matchedCount,
        attachmentCount: scan.attachmentCount,
        parsedTradeCount: scan.parsedTradeCount,
        insertedCount,
        duplicateCount,
        errorCount,
        warnings,
      };
    } catch (error) {
      const message = sanitizeError(error);
      this.logger.warn(
        `Email ${triggerType.toLowerCase()} sync failed for user ${settings.userId}: ${message}`,
      );
      await this.prisma.$transaction([
        this.prisma.emailSyncJob.update({
          where: { id: job.id },
          data: {
            status: EmailSyncJobStatus.FAILED,
            finishedAt: new Date(),
            errorMessage: message,
            errorCount: 1,
          },
        }),
        this.prisma.userSettings.update({
          where: { userId: settings.userId },
          data: {
            emailLastSyncAt: new Date(),
            emailLastSyncStatus: EmailSyncJobStatus.FAILED,
            emailLastSyncErrorMessage: message,
          },
        }),
      ]);

      throw new BadRequestException(message);
    }
  }

  private async importEmailTrades(
    userId: string,
    trades: EmailPdfTradePreview[],
  ): Promise<EmailImportPersistenceResult> {
    const settings = await this.prisma.userSettings.findUnique({
      where: { userId },
      select: {
        saveRawData: true,
      },
    });
    const saveRawData = settings?.saveRawData ?? true;

    return this.prisma.$transaction(async (tx) => {
      const importJob = await tx.importJob.create({
        data: {
          userId,
          source: 'IBKR_EMAIL_PDF',
          status: 'PREVIEWED',
          fileNames: uniqueAttachmentFileNames(trades),
          summary: buildEmailImportSummary(trades) as unknown as Prisma.InputJsonValue,
          previewRecords: sanitizePreviewTrades(trades) as unknown as Prisma.InputJsonValue,
          totalCount: trades.length,
        },
      });

      const importFileIds = await ensureEmailImportFiles(tx, userId, trades);
      const seenHashes = new Set<string>();
      const insertedRows: Prisma.TransactionEventCreateManyInput[] = [];
      const importRecords: Prisma.ImportRecordCreateManyInput[] = [];
      const messageResults = new Map<
        string,
        { inserted: number; duplicate: number; failed: number }
      >();
      const updatedAccountIds = new Set<string>();
      let earliestDate: Date | undefined;

      for (const [index, trade] of trades.entries()) {
        const messageResult =
          messageResults.get(trade.messageId) ??
          { inserted: 0, duplicate: 0, failed: 0 };
        messageResults.set(trade.messageId, messageResult);

        const confirmed = await confirmOneEmailTrade({
          tx,
          userId,
          trade,
          index,
          importJobId: importJob.id,
          importFileIds,
          seenHashes,
          saveRawData,
        });

        importRecords.push(confirmed.importRecord);
        if (confirmed.insertedRow) {
          insertedRows.push(confirmed.insertedRow);
          updatedAccountIds.add(confirmed.insertedRow.accountId);
          const tradeDate = new Date(confirmed.insertedRow.tradeDate);
          if (!earliestDate || tradeDate.getTime() < earliestDate.getTime()) {
            earliestDate = tradeDate;
          }
          messageResult.inserted += 1;
        } else if (confirmed.importRecord.status === 'DUPLICATE') {
          messageResult.duplicate += 1;
        } else if (confirmed.importRecord.status === 'FAILED') {
          messageResult.failed += 1;
        }
      }

      if (importRecords.length > 0) {
        await tx.importRecord.createMany({ data: importRecords });
      }

      const insertedCount = importRecords.filter(
        (record) => record.status === 'SUCCESS',
      ).length;
      const duplicateCount = importRecords.filter(
        (record) => record.status === 'DUPLICATE',
      ).length;
      const errorCount = importRecords.filter(
        (record) => record.status === 'FAILED',
      ).length;
      const status =
        errorCount === importRecords.length
          ? 'FAILED'
          : errorCount > 0 || duplicateCount > 0
            ? 'PARTIAL'
            : 'SUCCESS';

      await tx.importJob.update({
        where: { id: importJob.id },
        data: {
          status,
          finishedAt: new Date(),
          totalCount: importRecords.length,
          successCount: insertedCount,
          duplicateCount,
          failedCount: errorCount,
          errorMessage:
            errorCount > 0
              ? `${errorCount} email PDF trade records failed during import.`
              : null,
          summary: {
            totalCount: importRecords.length,
            insertedCount,
            duplicateCount,
            errorCount,
          },
        },
      });

      for (const [messageId, counts] of messageResults.entries()) {
        await tx.emailMessageRecord.updateMany({
          where: { userId, messageId },
          data: {
            status:
              counts.inserted > 0
                ? EmailMessageStatus.IMPORTED
                : counts.failed > 0
                  ? EmailMessageStatus.FAILED
                  : EmailMessageStatus.DUPLICATE,
            errorMessage:
              counts.failed > 0
                ? `${counts.failed} trade record(s) failed during confirmation.`
                : null,
          },
        });
      }

      return {
        importJobId: importJob.id,
        insertedRows,
        earliestDate,
        updatedAccountIds: Array.from(updatedAccountIds),
        response: {
          importJobId: importJob.id,
          insertedCount,
          duplicateCount,
          errorCount,
          warnings: [] as string[],
        },
      };
    });
  }

  private async runPostImportActions(
    userId: string,
    result: EmailImportPersistenceResult,
  ) {
    const warnings: string[] = [];
    if (result.insertedRows.length === 0) {
      return { warnings };
    }

    const settings = await this.prisma.userSettings.findUnique({
      where: { userId },
      select: {
        autoRefreshQuotesAfterImport: true,
        autoRegenerateSnapshotsAfterImport: true,
        autoRecalculateMetricsAfterImport: true,
      },
    });

    if (result.earliestDate && (settings?.autoRegenerateSnapshotsAfterImport ?? true)) {
      try {
        const startMonth = result.earliestDate.toISOString().slice(0, 7);
        const accountIds = Array.from(
          new Set(['ALL', ...result.updatedAccountIds.filter(Boolean)]),
        );
        await Promise.all(
          accountIds.map((accountId) =>
            this.monthlySnapshotService.regenerateSnapshotsFromMonth(
              userId,
              accountId,
              startMonth,
            ),
          ),
        );
      } catch (error) {
        warnings.push(`Post-import snapshot regeneration failed: ${sanitizeError(error)}`);
      }
    }

    if (settings?.autoRefreshQuotesAfterImport ?? true) {
      try {
        const quoteResult = await this.marketMaintenanceService.refreshQuotes(userId);
        warnings.push(...quoteResult.warnings);
      } catch (error) {
        warnings.push(`Post-import quote refresh failed: ${sanitizeError(error)}`);
      }
    }

    if (settings?.autoRecalculateMetricsAfterImport ?? true) {
      try {
        const analytics = await this.portfolioAnalyticsService.getAnalytics(userId);
        warnings.push(...analytics.warnings);
      } catch (error) {
        warnings.push(`Post-import metric recalculation failed: ${sanitizeError(error)}`);
      }
    }

    result.response.warnings.push(...warnings);
    return { warnings };
  }

  private async runScan(
    userId: string,
    dto: SearchIbkrMailsDto,
    options: { parsePdf: boolean },
  ): Promise<ScanMailboxResult> {
    const settings = await this.prisma.userSettings.findUnique({
      where: { userId },
    });

    if (!settings?.emailAddress || !settings.emailAuthSecretEncrypted) {
      throw new BadRequestException(
        'Please configure an email account in Settings before scanning.',
      );
    }

    if (settings.emailConnectionStatus !== EmailConnectionStatus.CONNECTED) {
      throw new BadRequestException(
        'Email account is not connected. Please test the connection in Settings first.',
      );
    }

    const providerConfig = EMAIL_PROVIDER_CONFIG[settings.emailProvider];
    const startedAt = new Date();
    const job = await this.prisma.emailSyncJob.create({
      data: {
        userId,
        emailAccountId: settings.id,
        triggerType: EmailSyncTriggerType.MANUAL,
        status: EmailSyncJobStatus.RUNNING,
        startedAt,
      },
    });

    try {
      const result = await this.scanMailbox({
        userId,
        emailAccountId: settings.id,
        email: settings.emailAddress,
        authCode: this.decryptSecret(settings.emailAuthSecretEncrypted),
        host: providerConfig.imapHost,
        port: providerConfig.imapPort,
        secure: providerConfig.secure,
        range: dto.range ?? '3d',
        parsePdf: options.parsePdf,
        duplicateMode: 'imported-only',
      });

      const status =
        result.errorCount > 0
          ? EmailSyncJobStatus.PARTIAL
          : EmailSyncJobStatus.SUCCESS;

      await this.prisma.$transaction([
        this.prisma.emailSyncJob.update({
          where: { id: job.id },
          data: {
            status,
            finishedAt: new Date(),
            scannedCount: result.scannedCount,
            matchedCount: result.matchedCount,
            attachmentCount: result.attachmentCount,
            parsedTradeCount: result.parsedTradeCount,
            newCount: result.newCount,
            insertedCount: 0,
            duplicateCount: result.duplicateCount,
            errorCount: result.errorCount,
            warnings: result.warnings as unknown as Prisma.InputJsonValue,
          },
        }),
        this.prisma.userSettings.update({
          where: { userId },
          data: {
            emailLastSyncAt: new Date(),
            emailLastSyncStatus: status,
            emailLastSyncErrorMessage: null,
            emailErrorMessage: null,
          },
        }),
      ]);

      return result;
    } catch (error) {
      const message = sanitizeError(error);
      this.logger.warn(`Email scan failed for user ${userId}: ${message}`);
      await this.prisma.emailSyncJob.update({
        where: { id: job.id },
        data: {
          status: EmailSyncJobStatus.FAILED,
          finishedAt: new Date(),
          errorMessage: message,
          errorCount: 1,
        },
      });
      await this.prisma.userSettings.update({
        where: { userId },
        data: {
          emailLastSyncAt: new Date(),
          emailLastSyncStatus: EmailSyncJobStatus.FAILED,
          emailLastSyncErrorMessage: message,
        },
      });

      throw new BadRequestException(message);
    }
  }

  private async scanMailbox(input: {
    userId: string;
    emailAccountId: string;
    email: string;
    authCode: string;
    host: string;
    port: number;
    secure: boolean;
    range: '3d' | '7d' | '30d' | '90d';
    parsePdf: boolean;
    duplicateMode: 'imported-only' | 'any-record';
  }): Promise<ScanMailboxResult> {
    const client = new ImapFlow({
      host: input.host,
      port: input.port,
      secure: input.secure,
      connectionTimeout: IMAP_CONNECTION_TIMEOUT_MS,
      greetingTimeout: IMAP_GREETING_TIMEOUT_MS,
      socketTimeout: IMAP_SOCKET_TIMEOUT_MS,
      auth: {
        user: input.email,
        pass: input.authCode,
      },
      logger: false,
    });
    client.on('error', (error) => {
      this.logger.warn(`IMAP client error: ${sanitizeError(error)}`);
    });

    const warnings: string[] = [];
    const diagnostics: EmailImportMailDiagnostic[] = [];
    const mails: EmailImportMailItem[] = [];
    const trades: EmailPdfTradePreview[] = [];
    let scannedCount = 0;
    let remainingPdfParseBudget = input.parsePdf
      ? MAX_PDF_ATTACHMENTS_TO_PARSE_PER_SCAN
      : 0;

    await client.connect();
    const lock = await client.getMailboxLock('INBOX', { readOnly: true });

    try {
      const since = getRangeStart(input.range);
      const candidateResult = await collectCandidateUids(client, since);
      const uids = [...candidateResult.uids].reverse();
      scannedCount = uids.length;

      if (candidateResult.truncated) {
        warnings.push(
          `IMAP returned ${candidateResult.totalFound} candidate mails for ${input.range}; only the latest ${uids.length} were scanned to avoid a timeout.`,
        );
      }

      if (candidateResult.strategy === 'latest-fallback') {
        warnings.push(
          'Date-range search returned no mails, so the scan used a small latest-mail fallback window.',
        );
      }

      if (uids.length === 0) {
        return emptyPreviewResult(scannedCount, warnings);
      }

      const existingRecords = await this.prisma.emailMessageRecord.findMany({
        where: { userId: input.userId },
        select: { messageId: true, attachmentHashes: true, status: true },
      });
      const importedRecords = existingRecords.filter(
        (record) => record.status === EmailMessageStatus.IMPORTED,
      );
      const duplicateRecords =
        input.duplicateMode === 'any-record' ? existingRecords : importedRecords;
      const existingMessageIds = new Set(
        duplicateRecords.map((record) => record.messageId),
      );
      const existingAttachmentHashes = new Set(
        duplicateRecords.flatMap((record) =>
          jsonStringArray(record.attachmentHashes),
        ),
      );

      const headerMessages = await withTimeout(
        client.fetchAll(
          uids,
          {
            envelope: true,
            internalDate: true,
          },
          { uid: true },
        ),
        IMAP_FETCH_HEADERS_TIMEOUT_MS,
        'IMAP mail header fetch timed out. Please retry later.',
      );

      for (const headerMessage of headerMessages) {
        const message = isPotentialIbkrMail(headerMessage)
          ? await fetchMessageStructure(client, headerMessage)
          : headerMessage;

        try {
          if (!isMessageWithinRange(message, since)) {
            continue;
          }

          diagnostics.push(createMessageDiagnostic(message));

          const inspected = await this.inspectMessage({
            client,
            userId: input.userId,
            emailAccountId: input.emailAccountId,
            message,
            existingMessageIds,
            existingAttachmentHashes,
            parsePdf: input.parsePdf,
            pdfParseBudget: remainingPdfParseBudget,
          });

          if (inspected) {
            mails.push(inspected.mail);
            trades.push(...inspected.trades);
            warnings.push(...inspected.warnings);
            remainingPdfParseBudget = Math.max(
              0,
              remainingPdfParseBudget - inspected.parsedAttachmentCount,
            );
          }
        } catch (error) {
          mails.push(createMessageError(message, sanitizeError(error)));
        }
      }
    } finally {
      lock.release();
      await client.logout().catch(() => undefined);
    }

    await this.markTransactionDuplicates(input.userId, trades);

    const attachmentCount = mails.reduce(
      (sum, mail) => sum + mail.attachments.length,
      0,
    );
    const mailDuplicateCount = mails.filter(
      (mail) => mail.status === 'DUPLICATE',
    ).length;
    const tradeDuplicateCount = trades.filter(
      (trade) => trade.status === 'DUPLICATE',
    ).length;
    const mailErrorCount = mails.filter((mail) => mail.status === 'ERROR').length;
    const tradeErrorCount = trades.filter(
      (trade) => trade.status === 'ERROR',
    ).length;
    const errorCount = mailErrorCount + tradeErrorCount;

    return {
      scannedCount,
      matchedCount: mails.length,
      attachmentCount,
      parsedTradeCount: trades.filter((trade) => trade.status !== 'ERROR')
        .length,
      newCount: trades.filter((trade) => trade.status === 'NEW').length,
      duplicateCount: mailDuplicateCount + tradeDuplicateCount,
      errorCount,
      mails,
      trades,
      warnings,
      diagnostics:
        mails.length === 0 ? selectRelevantDiagnostics(diagnostics) : undefined,
    };
  }

  private async inspectMessage(input: {
    client: ImapFlow;
    userId: string;
    emailAccountId: string;
    message: FetchMessageObject;
    existingMessageIds: Set<string>;
    existingAttachmentHashes: Set<string>;
    parsePdf: boolean;
    pdfParseBudget: number;
  }): Promise<InspectMessageResult | null> {
    const envelope = input.message.envelope;
    const subject = envelope?.subject?.trim() ?? '(No subject)';
    const from = formatAddresses(envelope?.from);
    const sender = formatAddresses(envelope?.sender);
    const replyTo = formatAddresses(envelope?.replyTo);
    const receivedAt = toDate(input.message.internalDate ?? envelope?.date);
    const messageId =
      envelope?.messageId?.trim() || `imap-uid-${input.message.uid}`;

    const attachmentCandidates = extractPdfAttachmentCandidates(
      input.message.bodyStructure,
    );

    if (
      !isIbkrTradeReport(
        subject,
        [from, sender, replyTo].filter(Boolean).join(', '),
        attachmentCandidates,
      )
    ) {
      return null;
    }

    const attachments = await buildAttachmentItems({
      client: input.client,
      uid: input.message.uid,
      messageId,
      candidates: attachmentCandidates,
      includeContentLimit: input.parsePdf ? input.pdfParseBudget : 0,
    });

    if (attachments.length === 0) {
      return null;
    }

    const duplicateByMessageId = input.existingMessageIds.has(messageId);
    const duplicateByAttachment = attachments.some((attachment) =>
      input.existingAttachmentHashes.has(attachment.attachmentHash),
    );
    let status: EmailImportMailItem['status'] =
      duplicateByMessageId || duplicateByAttachment ? 'DUPLICATE' : 'NEW';
    const trades: EmailPdfTradePreview[] = [];
    const warnings: string[] = [];

    if (input.parsePdf) {
      for (const attachment of attachments) {
        if (!attachment.content?.length) {
          attachment.status = status;
          warnings.push(
            `${attachment.filename} was listed but not parsed in this scan. The preview parses at most ${MAX_PDF_ATTACHMENTS_TO_PARSE_PER_SCAN} PDF attachment(s) per request.`,
          );
          continue;
        }

        const attachmentTrades = await this.parseAttachmentTrades({
          messageId,
          attachment,
          attachmentFilename: attachment.filename,
          inheritedStatus: status,
        });
        trades.push(...attachmentTrades.trades);
        warnings.push(...attachmentTrades.warnings);

        attachment.parsedTradeCount = attachmentTrades.trades.filter(
          (trade) => trade.status !== 'ERROR',
        ).length;
        if (attachmentTrades.trades.some((trade) => trade.status === 'ERROR')) {
          attachment.status = 'ERROR';
          attachment.errorMessage =
            attachmentTrades.trades.find((trade) => trade.status === 'ERROR')
              ?.errorMessage ?? 'PDF trade parsing failed.';
        } else {
          attachment.status = status;
        }
      }

      if (
        trades.length > 0 &&
        trades.every((trade) => trade.status === 'ERROR')
      ) {
        status = 'ERROR';
      }
    }

    const dbStatus =
      status === 'DUPLICATE'
        ? EmailMessageStatus.DUPLICATE
        : status === 'ERROR'
          ? EmailMessageStatus.ERROR
          : input.parsePdf && trades.length > 0
            ? EmailMessageStatus.PARSED
            : EmailMessageStatus.FOUND;

    await this.prisma.emailMessageRecord.upsert({
      where: {
        userId_messageId: {
          userId: input.userId,
          messageId,
        },
      },
      create: {
        userId: input.userId,
        emailAccountId: input.emailAccountId,
        messageId,
        subject,
        from,
        receivedAt,
        attachmentNames: attachments.map((attachment) => attachment.filename),
        attachmentHashes: attachments.map(
          (attachment) => attachment.attachmentHash,
        ),
        status: dbStatus,
        errorMessage: getMailErrorMessage(status, trades),
      },
      update: {
        emailAccountId: input.emailAccountId,
        subject,
        from,
        receivedAt,
        attachmentNames: attachments.map((attachment) => attachment.filename),
        attachmentHashes: attachments.map(
          (attachment) => attachment.attachmentHash,
        ),
        status: dbStatus,
        errorMessage: getMailErrorMessage(status, trades),
      },
    });

    input.existingMessageIds.add(messageId);
    for (const attachment of attachments) {
      input.existingAttachmentHashes.add(attachment.attachmentHash);
    }

    return {
      mail: {
        messageId,
        subject,
        from,
        receivedAt: receivedAt?.toISOString() ?? null,
        attachments: stripAttachmentContent(attachments),
        status,
        errorMessage: getMailErrorMessage(status, trades),
      },
      trades,
      warnings,
      parsedAttachmentCount: attachments.filter(
        (attachment) => attachment.content?.length,
      ).length,
    };
  }

  private async parseAttachmentTrades(input: {
    messageId: string;
    attachment: DownloadedPdfAttachment;
    attachmentFilename: string;
    inheritedStatus: EmailImportMailItem['status'];
  }) {
    if (!input.attachment.content?.length) {
      return {
        trades: [
          createErrorTradePreview({
            messageId: input.messageId,
            attachmentHash: input.attachment.attachmentHash,
            attachmentFilename: input.attachmentFilename,
            errorMessage: 'PDF attachment content could not be downloaded.',
            rawText: input.attachment.filename,
          }),
        ],
        warnings: [],
      };
    }

    if (input.attachment.content.length > MAX_PDF_ATTACHMENT_BYTES) {
      return {
        trades: [
          createErrorTradePreview({
            messageId: input.messageId,
            attachmentHash: input.attachment.attachmentHash,
            attachmentFilename: input.attachmentFilename,
            errorMessage:
              'PDF attachment is too large to parse in the current preview request.',
            rawText: input.attachment.filename,
          }),
        ],
        warnings: [
          `${input.attachment.filename} was skipped because it is larger than ${formatBytes(MAX_PDF_ATTACHMENT_BYTES)}.`,
        ],
      };
    }

    try {
      const pdfText = await withTimeout(
        extractPdfText(input.attachment.content),
        PDF_TEXT_TIMEOUT_MS,
        'PDF text extraction timed out.',
      );
      if (!pdfText.trim()) {
        return {
          trades: [
            createErrorTradePreview({
            messageId: input.messageId,
            attachmentHash: input.attachment.attachmentHash,
            attachmentFilename: input.attachmentFilename,
            errorMessage: 'PDF text is empty. The file may not have a text layer.',
              rawText: input.attachment.filename,
            }),
          ],
          warnings: [],
        };
      }

      const parsed = parseIbkrPdfTrades(pdfText);
      const trades = parsed.trades.map((trade, index) =>
        createTradePreview({
          trade,
          messageId: input.messageId,
          attachmentHash: input.attachment.attachmentHash,
          attachmentFilename: input.attachmentFilename,
          index,
          inheritedStatus: input.inheritedStatus,
        }),
      );

      for (const error of parsed.errors) {
        trades.push(
          createErrorTradePreview({
            messageId: input.messageId,
            attachmentHash: input.attachment.attachmentHash,
            attachmentFilename: input.attachmentFilename,
            errorMessage: error.message,
            rawText: error.rawText,
          }),
        );
      }

      if (trades.length === 0) {
        trades.push(
          createErrorTradePreview({
            messageId: input.messageId,
            attachmentHash: input.attachment.attachmentHash,
            attachmentFilename: input.attachmentFilename,
            errorMessage: 'No trade rows were parsed from the PDF Trades table.',
            rawText: input.attachment.filename,
          }),
        );
      }

      return {
        trades,
        warnings: parsed.warnings,
      };
    } catch (error) {
      return {
        trades: [
          createErrorTradePreview({
            messageId: input.messageId,
            attachmentHash: input.attachment.attachmentHash,
            attachmentFilename: input.attachmentFilename,
            errorMessage: sanitizeError(error),
            rawText: input.attachment.filename,
          }),
        ],
        warnings: [],
      };
    }
  }

  private async markTransactionDuplicates(
    userId: string,
    trades: EmailPdfTradePreview[],
  ) {
    const candidateHashes = trades
      .filter((trade) => trade.status !== 'ERROR')
      .map((trade) => trade.sourceHash);
    if (candidateHashes.length === 0) return;

    const existing = await this.prisma.transactionEvent.findMany({
      where: {
        userId,
        sourceEventHash: { in: candidateHashes },
      },
      select: { sourceEventHash: true },
    });
    const existingHashes = new Set(
      existing
        .map((event) => event.sourceEventHash)
        .filter((hash): hash is string => Boolean(hash)),
    );
    const seen = new Set<string>();

    for (const trade of trades) {
      if (trade.status === 'ERROR') continue;

      if (existingHashes.has(trade.sourceHash) || seen.has(trade.sourceHash)) {
        trade.status = 'DUPLICATE';
      }
      seen.add(trade.sourceHash);
    }
  }

  private decryptSecret(encryptedSecret: string) {
    const [version, iv, authTag, encrypted] = encryptedSecret.split(':');
    if (version !== 'v1' || !iv || !authTag || !encrypted) {
      throw new InternalServerErrorException('Email secret format is invalid.');
    }

    try {
      const decipher = createDecipheriv(
        'aes-256-gcm',
        getEmailSecretKey(),
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
}

function scanRangeFromSetting(range: Prisma.UserSettingsGetPayload<object>['emailDefaultScanRange']) {
  if (range === 'SCAN_90D') return '90d';
  if (range === 'SCAN_30D') return '30d';
  if (range === 'SCAN_7D') return '7d';
  return '3d';
}

function serializeEmailSyncJob(job: Prisma.EmailSyncJobGetPayload<object>): EmailSyncJobHistoryItem {
  return {
    id: job.id,
    triggerType: job.triggerType,
    status: job.status,
    startedAt: job.startedAt.toISOString(),
    finishedAt: job.finishedAt?.toISOString() ?? null,
    scannedCount: job.scannedCount,
    matchedCount: job.matchedCount,
    attachmentCount: job.attachmentCount,
    parsedTradeCount: job.parsedTradeCount,
    newCount: job.newCount,
    insertedCount: job.insertedCount,
    duplicateCount: job.duplicateCount,
    errorCount: job.errorCount,
    errorMessage: job.errorMessage,
    warnings: jsonStringArray(job.warnings ?? []),
  };
}

function buildScheduledJobKey(userId: string, emailAccountId: string, date: Date) {
  return [
    userId,
    emailAccountId,
    formatDateInTimezone(date, EMAIL_AUTO_SYNC_TIMEZONE),
    'daily-email-sync',
  ].join(':');
}

function formatDateInTimezone(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function startOfTodayInTimezone(date: Date, timeZone: string) {
  const day = formatDateInTimezone(date, timeZone);
  return new Date(`${day}T00:00:00.000Z`);
}

function isUniqueConstraintError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  );
}

export function isIbkrTradeReport(
  subject: string,
  from: string,
  attachments: Array<Pick<PdfAttachmentCandidate, 'filename' | 'contentType'>> = [],
) {
  const normalizedSubject = normalizeMatchText(subject);
  const normalizedFrom = normalizeMatchText(from);
  const hasTradeReportSubject =
    IBKR_TRADE_SUBJECT_REGEX_V2.test(normalizedSubject);
  const hasIbkrSender = IBKR_FROM_REGEX.test(normalizedFrom);
  const hasPdfAttachment = attachments.some(
    (attachment) =>
      normalizeContentType(attachment.contentType) === 'application/pdf' ||
      PDF_FILENAME_REGEX.test(attachment.filename),
  );

  // QQ/163 IMAP can expose a blank or partial From header for some system mails.
  // A dated "交易报告" subject plus a PDF attachment is still a strong IBKR daily
  // trade report signal, while "活动报表" and other FYI mails stay excluded by
  // the subject regex.
  return (
    hasTradeReportSubject &&
    (hasIbkrSender || hasPdfAttachment)
  );
}

function extractPdfAttachmentCandidates(
  bodyStructure: MessageStructureObject | undefined,
) {
  if (!bodyStructure) return [];

  const attachments: PdfAttachmentCandidate[] = [];
  walkBodyStructure(bodyStructure, (node) => {
    const filename =
      node.dispositionParameters?.filename ?? node.parameters?.name ?? '';
    const contentType = normalizeContentType(node.type);
    const isPdf =
      contentType === 'application/pdf' || PDF_FILENAME_REGEX.test(filename);

    if (!isPdf || !filename) return;

    attachments.push({
      part: node.part,
      filename,
      contentType,
      size: node.size ?? 0,
    });
  });

  return attachments.sort((left, right) => {
    const leftPreferred = PREFERRED_PDF_NAME_REGEX.test(left.filename);
    const rightPreferred = PREFERRED_PDF_NAME_REGEX.test(right.filename);
    if (leftPreferred === rightPreferred) {
      return left.filename.localeCompare(right.filename);
    }
    return leftPreferred ? -1 : 1;
  });
}

function extractBodyPartDiagnostics(
  bodyStructure: MessageStructureObject | undefined,
) {
  if (!bodyStructure) return [];

  const parts: EmailImportMailDiagnostic['bodyParts'] = [];
  walkBodyStructure(bodyStructure, (node) => {
    if (parts.length >= 12) return;

    const filename =
      node.dispositionParameters?.filename ??
      node.parameters?.name ??
      node.description ??
      undefined;

    parts.push({
      part: node.part,
      type: normalizeContentType(node.type),
      disposition: node.disposition,
      filename,
      size: node.size,
    });
  });

  return parts;
}

async function buildAttachmentItems(input: {
  client: ImapFlow;
  uid: number;
  messageId: string;
  candidates: PdfAttachmentCandidate[];
  includeContentLimit: number;
}): Promise<DownloadedPdfAttachment[]> {
  const parts = input.candidates
    .slice(0, input.includeContentLimit)
    .map((candidate) => candidate.part)
    .filter((part): part is string => Boolean(part));
  const downloaded =
    parts.length > 0
      ? await withTimeout(
          input.client.downloadMany(input.uid, parts, { uid: true }),
          IMAP_DOWNLOAD_TIMEOUT_MS,
          'PDF attachment download timed out. Please try a shorter scan range or retry later.',
        )
      : {};

  return input.candidates.map((candidate) => {
    const downloadedPart = candidate.part ? downloaded[candidate.part] : null;
    const content = downloadedPart?.content ?? undefined;
    const contentType = normalizeContentType(
      downloadedPart?.meta?.contentType ?? candidate.contentType,
    );

    return {
      filename: downloadedPart?.meta?.filename ?? candidate.filename,
      contentType,
      size: content?.length ?? candidate.size,
      attachmentHash: content
        ? hashAttachmentContent(content)
        : hashAttachmentMetadata({
            messageId: input.messageId,
            filename: candidate.filename,
            contentType,
            size: candidate.size,
          }),
      content,
    };
  });
}

async function extractPdfText(content: Buffer) {
  const parser = new PDFParse({ data: content });
  try {
    const result = await parser.getText({
      cellSeparator: '\t',
      pageJoiner: '\n',
    });
    return result.text;
  } finally {
    await parser.destroy();
  }
}

function createTradePreview(input: {
  trade: ParsedIbkrPdfTrade;
  messageId: string;
  attachmentHash: string;
  attachmentFilename?: string;
  index: number;
  inheritedStatus: EmailImportMailItem['status'];
}): EmailPdfTradePreview {
  const sourceHash = createEmailPdfTradeSourceHash(input.trade);

  return {
    tempId: `${input.attachmentHash.slice(0, 12)}-${input.index}-${sourceHash.slice(0, 8)}`,
    messageId: input.messageId,
    attachmentHash: input.attachmentHash,
    broker: 'IBKR',
    accountId: input.trade.accountId,
    symbol: input.trade.symbol,
    tradeDateTime: input.trade.tradeDateTime,
    tradeDate: input.trade.tradeDate,
    settleDate: input.trade.settleDate,
    exchange: input.trade.exchange,
    side: input.trade.side,
    quantity: input.trade.quantity,
    price: input.trade.price,
    proceeds: input.trade.proceeds,
    commission: input.trade.commission,
    fee: input.trade.fee,
    currency: input.trade.currency,
    orderType: input.trade.orderType,
    code: input.trade.code,
    source: 'IBKR_EMAIL_PDF',
    sourceHash,
    attachmentFilename: input.attachmentFilename,
    status: input.inheritedStatus === 'DUPLICATE' ? 'DUPLICATE' : 'NEW',
    rawText: input.trade.rawText,
    rawData: input.trade.rawData,
  };
}

function createErrorTradePreview(input: {
  messageId: string;
  attachmentHash: string;
  attachmentFilename?: string;
  errorMessage: string;
  rawText?: string;
}): EmailPdfTradePreview {
  const sourceHash = createHash('sha256')
    .update(
      [
        'IBKR_EMAIL_PDF_ERROR',
        input.messageId,
        input.attachmentHash,
        input.rawText ?? '',
        input.errorMessage,
      ].join('|'),
    )
    .digest('hex');

  return {
    tempId: `error-${input.attachmentHash.slice(0, 12)}-${sourceHash.slice(0, 8)}`,
    messageId: input.messageId,
    attachmentHash: input.attachmentHash,
    broker: 'IBKR',
    symbol: '',
    tradeDateTime: '',
    tradeDate: '',
    side: 'BUY',
    quantity: 0,
    price: 0,
    currency: '',
    source: 'IBKR_EMAIL_PDF',
    sourceHash,
    attachmentFilename: input.attachmentFilename,
    status: 'ERROR',
    errorMessage: input.errorMessage,
    rawText: input.rawText,
  };
}

function stripAttachmentContent(
  attachments: DownloadedPdfAttachment[],
): EmailImportAttachmentItem[] {
  return attachments.map(({ content: _content, ...attachment }) => attachment);
}

function getMailErrorMessage(
  status: EmailImportMailItem['status'],
  trades: EmailPdfTradePreview[],
) {
  if (status !== 'ERROR') return undefined;
  return (
    trades.find((trade) => trade.status === 'ERROR')?.errorMessage ??
    'PDF trade parsing failed.'
  );
}

function walkBodyStructure(
  node: MessageStructureObject,
  visit: (node: MessageStructureObject) => void,
) {
  visit(node);
  for (const child of node.childNodes ?? []) {
    walkBodyStructure(child, visit);
  }
}

function normalizeContentType(value?: string) {
  const raw = value?.toLowerCase() ?? 'application/octet-stream';
  return raw.includes('/') ? raw : `application/${raw}`;
}

function hashAttachmentMetadata(input: {
  messageId: string;
  filename: string;
  contentType: string;
  size: number;
}) {
  // Fallback for unusual IMAP servers that expose attachment metadata but not a
  // fetchable body part. Normal PDF attachments use hashAttachmentContent().
  return createHash('sha256')
    .update(
      [
        input.messageId.trim().toLowerCase(),
        input.filename.trim().toLowerCase(),
        input.contentType.trim().toLowerCase(),
        String(input.size),
      ].join('|'),
    )
    .digest('hex');
}

function hashAttachmentContent(content: Buffer) {
  return createHash('sha256').update(content).digest('hex');
}

function isPotentialIbkrMail(message: FetchMessageObject) {
  const envelope = message.envelope;
  const subject = normalizeMatchText(envelope?.subject?.trim() ?? '');
  const from = normalizeMatchText(
    [
      formatAddresses(envelope?.from),
      formatAddresses(envelope?.sender),
      formatAddresses(envelope?.replyTo),
    ]
      .filter(Boolean)
      .join(', '),
  );

  return IBKR_TRADE_SUBJECT_REGEX_V2.test(subject) || IBKR_FROM_REGEX.test(from);
}

async function fetchMessageStructure(
  client: ImapFlow,
  headerMessage: FetchMessageObject,
) {
  const messageWithStructure = await withTimeout(
    client.fetchOne(
      headerMessage.uid,
      {
        bodyStructure: true,
      },
      { uid: true },
    ),
    IMAP_FETCH_STRUCTURE_TIMEOUT_MS,
    'IMAP attachment metadata fetch timed out for one message.',
  );

  return messageWithStructure
    ? {
        ...headerMessage,
        bodyStructure: messageWithStructure.bodyStructure,
      }
    : headerMessage;
}

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

export async function collectCandidateUids(
  client: Pick<ImapFlow, 'search'>,
  since: Date,
): Promise<CandidateUidResult> {
  const targetedUids = await searchUids(client, createTargetedSearch(since));
  if (targetedUids.length > 0) {
    return limitCandidateUids(targetedUids, 'targeted');
  }

  const sinceUids = await searchUids(client, { since });
  if (sinceUids.length > 0) {
    return limitCandidateUids(sinceUids, 'date-range');
  }

  // Some IMAP providers can miss date searches because of server-side date
  // indexing quirks. Only then do a small latest-mail fallback; doing SEARCH ALL
  // on every scan makes a 7d request expensive on large mailboxes.
  const allUids = await searchUids(client, { all: true });
  const latestUids = allUids.slice(-LATEST_UID_FALLBACK_LIMIT);

  return limitCandidateUids(latestUids, 'latest-fallback');
}

function createTargetedSearch(since: Date): SearchObject {
  return {
    since,
    or: [
      { from: 'interactivebrokers' },
      { from: 'Interactive Brokers' },
      { from: 'ibkr' },
      { subject: 'Daily Trade Report' },
      { subject: 'Trade Report' },
      { subject: '交易报告' },
    ],
  };
}

async function searchUids(
  client: Pick<ImapFlow, 'search'>,
  query: SearchObject,
) {
  return ((await withTimeout(
    client.search(query, { uid: true }),
    IMAP_SEARCH_TIMEOUT_MS,
    'IMAP search timed out. Please try a shorter scan range or retry later.',
  )) || []) as number[];
}

function limitCandidateUids(
  uids: number[],
  strategy: CandidateUidResult['strategy'],
): CandidateUidResult {
  const sorted = uniqueSortedUids(uids);
  const limited = sorted.slice(-MAX_CANDIDATE_UIDS_PER_SCAN);

  return {
    uids: limited,
    totalFound: sorted.length,
    strategy,
    truncated: sorted.length > limited.length,
  };
}

function uniqueSortedUids(uids: number[]) {
  return Array.from(new Set(uids)).sort((left, right) => left - right);
}

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  message: string,
): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(message)), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}

function isMessageWithinRange(message: FetchMessageObject, since: Date) {
  const receivedAt = toDate(message.internalDate ?? message.envelope?.date);
  if (!receivedAt) return true;
  return receivedAt.getTime() >= since.getTime();
}

function getRangeStart(range: '3d' | '7d' | '30d' | '90d') {
  const days =
    range === '90d' ? 90 : range === '30d' ? 30 : range === '7d' ? 7 : 3;
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(0, 0, 0, 0);
  return date;
}

function getEmailSecretKey() {
  const secret = process.env.EMAIL_SECRET_KEY;
  if (!secret) {
    throw new InternalServerErrorException('EMAIL_SECRET_KEY is not configured.');
  }
  return createHash('sha256').update(secret).digest();
}

export function formatAddresses(addresses?: MessageAddressObject[]) {
  if (!addresses?.length) return '';
  return addresses
    .map((address) => {
      // Some IMAP servers expose only the display name for system senders.
      // Keeping the name matters because IBKR mail often appears as
      // "Interactive Brokers Client ..." in QQ Mail.
      const name = address.name?.trim() ?? '';
      const mailbox = address.address ?? '';
      return name && mailbox ? `${name} <${mailbox}>` : name || mailbox;
    })
    .filter(Boolean)
    .join(', ');
}

function normalizeMatchText(value: string) {
  return value.normalize('NFKC').replace(/\s+/g, ' ').trim();
}

function toDate(value?: Date | string | null) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function emptyPreviewResult(
  scannedCount: number,
  warnings: string[],
): ScanMailboxResult {
  return {
    scannedCount,
    matchedCount: 0,
    attachmentCount: 0,
    parsedTradeCount: 0,
    newCount: 0,
    duplicateCount: 0,
    errorCount: 0,
    mails: [],
    trades: [],
    warnings,
  };
}

function createMessageDiagnostic(
  message: FetchMessageObject,
): EmailImportMailDiagnostic {
  const envelope = message.envelope;
  const subject = envelope?.subject?.trim() ?? '(No subject)';
  const from = formatAddresses(envelope?.from);
  const sender = formatAddresses(envelope?.sender);
  const replyTo = formatAddresses(envelope?.replyTo);
  const pdfCandidates = extractPdfAttachmentCandidates(message.bodyStructure);

  return {
    uid: message.uid,
    subject,
    from,
    sender,
    replyTo,
    receivedAt:
      toDate(message.internalDate ?? envelope?.date)?.toISOString() ?? null,
    subjectMatches: IBKR_TRADE_SUBJECT_REGEX_V2.test(normalizeMatchText(subject)),
    fromMatches: IBKR_FROM_REGEX.test(
      normalizeMatchText([from, sender, replyTo].filter(Boolean).join(', ')),
    ),
    pdfCandidateCount: pdfCandidates.length,
    attachmentNames: pdfCandidates.map((attachment) => attachment.filename),
    bodyParts: extractBodyPartDiagnostics(message.bodyStructure),
  };
}

function selectRelevantDiagnostics(items: EmailImportMailDiagnostic[]) {
  return items
    .map((item) => ({ item, score: scoreDiagnostic(item) }))
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      return right.item.uid - left.item.uid;
    })
    .slice(0, 40)
    .map(({ item }) => item);
}

function scoreDiagnostic(item: EmailImportMailDiagnostic) {
  let score = 0;
  const subject = normalizeMatchText(item.subject);

  if (item.subjectMatches) score += 80;
  if (/(交易报告|trade\s+report|daily\s+trade)/i.test(subject)) score += 60;
  if (/(交易|报告|trade|daily)/i.test(subject)) score += 20;
  if (item.pdfCandidateCount > 0) score += 50 + item.pdfCandidateCount * 10;
  if (item.fromMatches) score += 15;

  for (const part of item.bodyParts) {
    const type = normalizeContentType(part.type);
    const filename = part.filename ?? '';
    const disposition = part.disposition ?? '';
    if (type === 'application/pdf' || PDF_FILENAME_REGEX.test(filename)) {
      score += 40;
    }
    if (/attachment/i.test(disposition) || filename) {
      score += 10;
    }
  }

  return score;
}

function createMessageError(
  message: FetchMessageObject,
  errorMessage: string,
): EmailImportMailItem {
  const envelope = message.envelope;
  return {
    messageId: envelope?.messageId?.trim() || `imap-uid-${message.uid}`,
    subject: envelope?.subject ?? '(No subject)',
    from: formatAddresses(envelope?.from),
    receivedAt:
      toDate(message.internalDate ?? envelope?.date)?.toISOString() ?? null,
    attachments: [],
    status: 'ERROR',
    errorMessage,
  };
}

function sanitizeError(error: unknown) {
  if (!(error instanceof Error)) return 'Email scan failed.';
  return error.message.replace(/AUTHENTICATE|LOGIN/gi, 'AUTH');
}

function jsonStringArray(value: Prisma.JsonValue) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

function uniqueAttachmentFileNames(trades: EmailPdfTradePreview[]) {
  const fileNames = trades
    .map((trade) => trade.attachmentFilename)
    .filter((value): value is string => Boolean(value?.trim()));

  if (fileNames.length === 0) {
    return ['IBKR Email PDF'];
  }

  return Array.from(new Set(fileNames));
}

function sanitizePreviewTrades(trades: EmailPdfTradePreview[]) {
  return trades.map(({ rawText: _rawText, ...trade }) => trade);
}

function buildEmailImportSummary(trades: EmailPdfTradePreview[]) {
  return {
    totalCount: trades.length,
    newCount: trades.filter((trade) => trade.status === 'NEW').length,
    duplicateCount: trades.filter((trade) => trade.status === 'DUPLICATE').length,
    errorCount: trades.filter((trade) => trade.status === 'ERROR').length,
  };
}

async function ensureEmailImportFiles(
  tx: Prisma.TransactionClient,
  userId: string,
  trades: EmailPdfTradePreview[],
) {
  const files = new Map<
    string,
    { filename: string; trades: EmailPdfTradePreview[] }
  >();

  for (const trade of trades) {
    if (!trade.attachmentHash) continue;
    const current =
      files.get(trade.attachmentHash) ??
      {
        filename:
          trade.attachmentFilename ??
          `IBKR_Email_PDF_${trade.attachmentHash.slice(0, 12)}.pdf`,
        trades: [],
      };
    current.trades.push(trade);
    files.set(trade.attachmentHash, current);
  }

  const fileIds = new Map<string, string>();
  for (const [attachmentHash, file] of files.entries()) {
    const existing = await tx.importFile.findUnique({
      where: {
        userId_fileHash: {
          userId,
          fileHash: attachmentHash,
        },
      },
    });

    if (existing) {
      if (existing.status === 'PREVIEWED') {
        await tx.importFile.update({
          where: { id: existing.id },
          data: { status: 'CONFIRMED', confirmedAt: new Date() },
        });
      }
      fileIds.set(attachmentHash, existing.id);
      continue;
    }

    const validDates = file.trades
      .map((trade) => trade.tradeDate)
      .filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date))
      .sort();

    const importFile = await tx.importFile.create({
      data: {
        userId,
        filename: file.filename,
        source: 'IBKR_EMAIL_PDF',
        fileHash: attachmentHash,
        status: 'CONFIRMED',
        periodStart: validDates[0] ? dateOnly(validDates[0]) : null,
        periodEnd: validDates[validDates.length - 1]
          ? dateOnly(validDates[validDates.length - 1])
          : null,
        summary: buildEmailImportSummary(file.trades) as unknown as Prisma.InputJsonValue,
        previewEvents: sanitizePreviewTrades(file.trades) as unknown as Prisma.InputJsonValue,
        confirmedAt: new Date(),
      },
    });
    fileIds.set(attachmentHash, importFile.id);
  }

  return fileIds;
}

async function confirmOneEmailTrade(input: {
  tx: Prisma.TransactionClient;
  userId: string;
  trade: EmailPdfTradePreview;
  index: number;
  importJobId: string;
  importFileIds: Map<string, string>;
  seenHashes: Set<string>;
  saveRawData: boolean;
}): Promise<{
  importRecord: Prisma.ImportRecordCreateManyInput;
  insertedRow?: Prisma.TransactionEventCreateManyInput;
}> {
  const { tx, userId, trade, importJobId, importFileIds, seenHashes } = input;

  if (trade.status === 'ERROR') {
    return {
      importRecord: buildEmailImportRecord(userId, importJobId, trade, 'FAILED',
        trade.errorMessage ?? 'Record cannot be imported.'),
    };
  }

  if (trade.status === 'DUPLICATE') {
    return {
      importRecord: buildEmailImportRecord(userId, importJobId, trade, 'DUPLICATE'),
    };
  }

  if (trade.status !== 'NEW') {
    return {
      importRecord: buildEmailImportRecord(
        userId,
        importJobId,
        trade,
        'FAILED',
        `Unsupported preview status: ${trade.status}.`,
      ),
    };
  }

  const validationError = validateEmailTradePreview(trade);
  if (validationError) {
    return {
      importRecord: buildEmailImportRecord(
        userId,
        importJobId,
        trade,
        'FAILED',
        validationError,
      ),
    };
  }

  if (seenHashes.has(trade.sourceHash)) {
    return {
      importRecord: buildEmailImportRecord(
        userId,
        importJobId,
        trade,
        'DUPLICATE',
        'Duplicate inside this email PDF confirmation.',
      ),
    };
  }
  seenHashes.add(trade.sourceHash);

  const existing = await tx.transactionEvent.findUnique({
    where: {
      userId_sourceEventHash: {
        userId,
        sourceEventHash: trade.sourceHash,
      },
    },
    select: { id: true },
  });
  if (existing) {
    return {
      importRecord: buildEmailImportRecord(userId, importJobId, trade, 'DUPLICATE'),
    };
  }

  const importFileId = importFileIds.get(trade.attachmentHash);
  if (!importFileId) {
    return {
      importRecord: buildEmailImportRecord(
        userId,
        importJobId,
        trade,
        'FAILED',
        'Import file metadata was not created.',
      ),
    };
  }

  const row = buildEmailTransactionEventRow(
    userId,
    importFileId,
    trade,
    input.index + 1,
    input.saveRawData,
  );
  await tx.transactionEvent.create({ data: row });

  return {
    importRecord: buildEmailImportRecord(userId, importJobId, trade, 'SUCCESS'),
    insertedRow: row,
  };
}

function validateEmailTradePreview(trade: EmailPdfTradePreview) {
  const missing = [
    !trade.sourceHash ? 'sourceHash' : null,
    !trade.attachmentHash ? 'attachmentHash' : null,
    !trade.symbol ? 'Symbol' : null,
    !trade.tradeDate ? 'Trade Date' : null,
    !trade.tradeDateTime ? 'Trade Date/Time' : null,
    !trade.side ? 'Type' : null,
    typeof trade.quantity !== 'number' || !Number.isFinite(trade.quantity)
      ? 'Quantity'
      : null,
    typeof trade.price !== 'number' || !Number.isFinite(trade.price)
      ? 'Price'
      : null,
    !trade.currency ? 'Currency' : null,
  ].filter(Boolean);

  return missing.length > 0
    ? `Missing required field(s): ${missing.join(', ')}.`
    : null;
}

function buildEmailImportRecord(
  userId: string,
  importJobId: string,
  trade: EmailPdfTradePreview,
  status: Prisma.ImportRecordCreateManyInput['status'],
  errorMessage?: string,
): Prisma.ImportRecordCreateManyInput {
  return {
    userId,
    importJobId,
    recordType: 'TRADE',
    sourceHash: trade.sourceHash,
    status,
    rawData: buildEmailTradeRawData(trade) as unknown as Prisma.InputJsonValue,
    normalizedData: buildEmailTradeNormalizedData(trade) as unknown as
      | Prisma.InputJsonValue
      | undefined,
    errorMessage,
  };
}

function buildEmailTransactionEventRow(
  userId: string,
  importFileId: string,
  trade: EmailPdfTradePreview,
  rawRowIndex: number,
  saveRawData: boolean,
): Prisma.TransactionEventCreateManyInput {
  const quantityAbs = Math.abs(trade.quantity);
  const signedQuantity = trade.side === 'SELL' ? -quantityAbs : quantityAbs;
  const proceeds = typeof trade.proceeds === 'number'
    ? trade.proceeds
    : trade.side === 'BUY'
      ? -quantityAbs * trade.price
      : quantityAbs * trade.price;
  const commission = (trade.commission ?? 0) + (trade.fee ?? 0);
  const netAmount = proceeds + commission;

  return {
    userId,
    importFileId,
    source: 'IBKR_EMAIL_PDF',
    sourceEventHash: trade.sourceHash,
    sourceFileName:
      trade.attachmentFilename ??
      `IBKR_Email_PDF_${trade.attachmentHash.slice(0, 12)}.pdf`,
    sourceSection: 'TRADES',
    rawRowIndex,
    rawData: (saveRawData ? buildEmailTradeRawData(trade) : {}) as Prisma.InputJsonValue,
    tradeDate: dateOnly(trade.tradeDate),
    accountId: trade.accountId ?? '',
    description: `IBKR Email PDF ${trade.side} ${trade.symbol}`,
    ibkrType: trade.side,
    eventType: trade.side === 'BUY' ? 'TRADE_BUY' : 'TRADE_SELL',
    symbol: trade.symbol,
    quantity: decimal(signedQuantity),
    absQuantity: decimal(quantityAbs),
    price: decimal(trade.price),
    currency: trade.currency,
    grossAmount: decimal(proceeds),
    commission: decimal(commission),
    netAmount: decimal(netAmount),
    side: trade.side,
    isTrade: true,
    isExternalCashFlow: false,
    isIncome: false,
    isTaxOrFee: false,
  };
}

function buildEmailTradeRawData(trade: EmailPdfTradePreview) {
  return {
    source: trade.source,
    messageId: trade.messageId,
    attachmentHash: trade.attachmentHash,
    attachmentFilename: trade.attachmentFilename,
    accountId: trade.accountId,
    symbol: trade.symbol,
    tradeDateTime: trade.tradeDateTime,
    tradeDate: trade.tradeDate,
    settleDate: trade.settleDate,
    exchange: trade.exchange,
    side: trade.side,
    quantity: trade.quantity,
    price: trade.price,
    proceeds: trade.proceeds,
    commission: trade.commission,
    fee: trade.fee,
    currency: trade.currency,
    orderType: trade.orderType,
    code: trade.code,
    rawData: trade.rawData,
  };
}

function buildEmailTradeNormalizedData(trade: EmailPdfTradePreview) {
  return {
    ...buildEmailTradeRawData(trade),
    sourceHash: trade.sourceHash,
    amount: trade.proceeds,
  };
}

function dateOnly(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function decimal(value: number) {
  return new Prisma.Decimal(value);
}
