import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CashFlowType, Prisma } from '@prisma/client';
import { QuoteService } from '../market-data/quote-service';
import { MonthlySnapshotService } from '../portfolio/monthly-snapshot.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  ImportConfirmRecord,
  ImportConfirmResponse,
  ImportPreviewRecord,
  NormalizedImportRecordData,
} from './import-preview.types';
import { createCrossSourceTradeFingerprint } from './trade-identity';

function toDateOnly(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function decimal(value: number) {
  return new Prisma.Decimal(value);
}

function jsonArrayToPreviewRecords(value: Prisma.JsonValue): ImportPreviewRecord[] {
  return Array.isArray(value) ? (value as unknown as ImportPreviewRecord[]) : [];
}

function recordStatusToDbStatus(
  status: ImportConfirmRecord['status'],
): 'SUCCESS' | 'DUPLICATE' | 'UPDATED' | 'FAILED' {
  return status;
}

function buildTransactionEventRow(
  userId: string,
  importFileId: string,
  data: NormalizedImportRecordData,
  saveRawData = true,
): Prisma.TransactionEventCreateManyInput {
  return {
    userId,
    importFileId,
    source: 'IBKR_CSV',
    sourceEventHash: data.sourceHash,
    sourceFileName: data.sourceFileName,
    sourceSection: data.sourceSection,
    rawRowIndex: data.rawRowIndex,
    rawData: (saveRawData ? data.rawData : {}) as Prisma.InputJsonValue,
    tradeDate: toDateOnly(data.tradeDate),
    accountId: data.accountId,
    description: data.description,
    ibkrType: data.ibkrType,
    eventType: data.eventType as Prisma.TransactionEventCreateManyInput['eventType'],
    symbol: data.symbol ?? null,
    quantity:
      typeof data.quantity === 'number' ? decimal(data.quantity) : null,
    absQuantity:
      typeof data.absQuantity === 'number' ? decimal(data.absQuantity) : null,
    price: typeof data.price === 'number' ? decimal(data.price) : null,
    currency: data.currency ?? null,
    grossAmount: decimal(data.grossAmount),
    commission: decimal(data.commission),
    netAmount: decimal(data.netAmount),
    side: data.side as Prisma.TransactionEventCreateManyInput['side'],
    isTrade: data.isTrade,
    isExternalCashFlow: data.isExternalCashFlow,
    isIncome: data.isIncome,
    isTaxOrFee: data.isTaxOrFee,
  };
}

function transactionEventToCashFlow(
  row: Prisma.TransactionEventCreateManyInput,
): Prisma.CashFlowCreateManyInput | null {
  if (row.eventType !== 'DEPOSIT' && row.eventType !== 'WITHDRAWAL') {
    return null;
  }

  return {
    userId: row.userId as string,
    accountId: row.accountId,
    type:
      row.eventType === 'DEPOSIT'
        ? CashFlowType.DEPOSIT
        : CashFlowType.WITHDRAWAL,
    amount: row.netAmount,
    currency: row.currency ?? 'USD',
    flowDate: row.tradeDate,
    source: `${row.sourceSection} via ${row.sourceFileName}`,
    sourceHash: row.sourceEventHash ?? undefined,
    rawData: row.rawData,
    remark: row.description,
  };
}

function mergeRawData(
  oldRawData: Prisma.JsonValue,
  newRawData: Record<string, string> | undefined,
) {
  if (!newRawData) {
    return oldRawData as Prisma.InputJsonValue;
  }

  if (
    typeof oldRawData === 'object' &&
    oldRawData !== null &&
    !Array.isArray(oldRawData)
  ) {
    return { ...oldRawData, ...newRawData } as Prisma.InputJsonValue;
  }

  return newRawData as Prisma.InputJsonValue;
}

function hasCashReport(summary: unknown) {
  const value = summary as
    | { cashReport?: { cashBalance?: unknown } }
    | null
    | undefined;

  return typeof value?.cashReport?.cashBalance === 'number';
}

const DEFAULT_USER_ID = 'default_user';

@Injectable()
export class ImportConfirmService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly monthlySnapshotService: MonthlySnapshotService,
    private readonly quoteService?: QuoteService,
  ) {}

  async confirm(
    userIdOrJobPreviewId?: string,
    jobPreviewIdOrRecords?: string | unknown[],
    maybeRecords?: unknown[],
  ): Promise<ImportConfirmResponse> {
    const hasExplicitUser =
      typeof jobPreviewIdOrRecords === 'string' || Array.isArray(maybeRecords);
    const userId = hasExplicitUser
      ? (userIdOrJobPreviewId ?? DEFAULT_USER_ID)
      : DEFAULT_USER_ID;
    const jobPreviewId = hasExplicitUser
      ? (jobPreviewIdOrRecords as string | undefined)
      : userIdOrJobPreviewId;
    const requestRecords = hasExplicitUser
      ? maybeRecords
      : Array.isArray(jobPreviewIdOrRecords)
        ? jobPreviewIdOrRecords
        : undefined;
    const existingJob = jobPreviewId
      ? await this.prisma.importJob.findUnique({ where: { id: jobPreviewId } })
      : null;

    if (jobPreviewId && (!existingJob || existingJob.userId !== userId)) {
      throw new NotFoundException(`Import preview ${jobPreviewId} was not found.`);
    }

    if (existingJob && existingJob.status !== 'PREVIEWED') {
      throw new ConflictException(
        `Import job ${existingJob.id} has already been confirmed.`,
      );
    }

    const records =
      existingJob?.previewRecords !== null && existingJob?.previewRecords !== undefined
        ? jsonArrayToPreviewRecords(existingJob.previewRecords)
        : ((requestRecords ?? []) as ImportPreviewRecord[]);

    if (records.length === 0) {
      throw new BadRequestException('No preview records are available to confirm.');
    }

    const settings = this.prisma.userSettings?.findUnique
      ? await this.prisma.userSettings.findUnique({
          where: { userId },
          select: {
            autoRefreshQuotesAfterImport: true,
            autoRegenerateSnapshotsAfterImport: true,
            saveRawData: true,
          },
        })
      : null;
    const saveRawData = settings?.saveRawData ?? true;
    const autoRefreshQuotesAfterImport =
      settings?.autoRefreshQuotesAfterImport ?? true;
    const autoRegenerateSnapshotsAfterImport =
      settings?.autoRegenerateSnapshotsAfterImport ?? true;

    const result = await this.prisma.$transaction(async (tx) => {
      const importJob =
        existingJob ??
        (await tx.importJob.create({
          data: {
            fileNames: [],
            userId,
            status: 'PREVIEWED',
            summary: {},
            previewRecords: records as unknown as Prisma.InputJsonValue,
            totalCount: records.length,
          },
        }));

      const importFileIds = await this.ensureImportFiles(tx, userId, records);
      const seenHashes = new Set<string>();
      const seenTradeFingerprints = new Set<string>();
      const confirmedRecords: ImportConfirmRecord[] = [];
      const insertedRows: Prisma.TransactionEventCreateManyInput[] = [];
      const updatedAccountIds = new Set<string>();
      let earliestDate: Date | undefined;

      for (const record of records) {
        const confirmed = await this.confirmOneRecord(
          tx,
          userId,
          record,
          importFileIds,
          seenHashes,
          seenTradeFingerprints,
          saveRawData,
        );

        confirmedRecords.push(confirmed.record);
        if (confirmed.insertedRow) {
          insertedRows.push(confirmed.insertedRow);
          updatedAccountIds.add(confirmed.insertedRow.accountId);
          const tradeDate = new Date(confirmed.insertedRow.tradeDate);
          if (!earliestDate || tradeDate.getTime() < earliestDate.getTime()) {
            earliestDate = tradeDate;
          }
        }

        if (confirmed.updatedTradeDate) {
          updatedAccountIds.add(record.data.accountId);
          if (
            !earliestDate ||
            confirmed.updatedTradeDate.getTime() < earliestDate.getTime()
          ) {
            earliestDate = confirmed.updatedTradeDate;
          }
        }
      }

      await tx.importRecord.createMany({
        data: confirmedRecords.map((record) => {
          const preview = records.find((item) => item.tempId === record.tempId);
          return {
            userId,
            importJobId: importJob.id,
            recordType: record.recordType,
            sourceHash: record.sourceHash,
            status: recordStatusToDbStatus(record.status),
            rawData: saveRawData
              ? (preview?.rawData as Prisma.InputJsonValue)
              : undefined,
            normalizedData: preview?.data as unknown as Prisma.InputJsonValue,
            errorMessage: record.errorMessage,
          };
        }),
      });

      const insertedRecords = confirmedRecords.filter(
        (record) => record.status === 'SUCCESS',
      ).length;
      const duplicateRecords = confirmedRecords.filter(
        (record) => record.status === 'DUPLICATE',
      ).length;
      const updatedRecords = confirmedRecords.filter(
        (record) => record.status === 'UPDATED',
      ).length;
      const failedRecords = confirmedRecords.filter(
        (record) => record.status === 'FAILED',
      ).length;
      const status =
        failedRecords === records.length
          ? 'FAILED'
          : failedRecords > 0 || duplicateRecords > 0 || updatedRecords > 0
            ? 'PARTIAL'
            : 'SUCCESS';

      await tx.importJob.update({
        where: { id: importJob.id },
        data: {
          status,
          finishedAt: new Date(),
          totalCount: records.length,
          successCount: insertedRecords,
          duplicateCount: duplicateRecords,
          updateCount: updatedRecords,
          failedCount: failedRecords,
          errorMessage:
            failedRecords > 0
              ? `${failedRecords} records failed during import.`
              : null,
        },
      });

      return {
        importJobId: importJob.id,
        earliestDate,
        updatedAccountIds: Array.from(updatedAccountIds),
        insertedRows,
        response: {
          importJobId: importJob.id,
          summary: {
            totalRecords: records.length,
            insertedRecords,
            duplicateRecords,
            updatedRecords,
            failedRecords,
          },
          records: confirmedRecords,
          warnings: [] as string[],
        },
      };
    });

    if (result.earliestDate && autoRegenerateSnapshotsAfterImport) {
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
    }

    if (autoRefreshQuotesAfterImport && this.quoteService) {
      const symbols = Array.from(
        new Set(
          result.insertedRows
            .map((row) => row.symbol)
            .filter((symbol): symbol is string => typeof symbol === 'string'),
        ),
      );

      if (symbols.length > 0) {
        const quoteResult = await this.quoteService.getCurrentQuotes(symbols, userId);
        result.response.warnings.push(...quoteResult.warnings);
      }
    }

    return result.response;
  }

  private async ensureImportFiles(
    tx: Prisma.TransactionClient,
    userId: string,
    records: ImportPreviewRecord[],
  ) {
    const fileMap = new Map<string, string>();
    const files = new Map<
      string,
      {
        fileName: string;
        fileHash: string;
        records: ImportPreviewRecord[];
        summary?: NormalizedImportRecordData['sourceFileSummary'];
      }
    >();

    for (const record of records) {
      const fileHash = record.data.sourceFileHash;
      if (!files.has(fileHash)) {
        files.set(fileHash, {
          fileName: record.data.sourceFileName,
          fileHash,
          summary: record.data.sourceFileSummary,
          records: [],
        });
      }
      const file = files.get(fileHash);
      file?.records.push(record);
      if (file && !file.summary && record.data.sourceFileSummary) {
        file.summary = record.data.sourceFileSummary;
      }
    }

    for (const file of files.values()) {
      const existing = await tx.importFile.findUnique({
        where: {
          userId_fileHash: {
            userId,
            fileHash: file.fileHash,
          },
        },
      });

      if (existing) {
        const data: Prisma.ImportFileUpdateInput = {};

        if (existing.status === 'PREVIEWED') {
          data.status = 'CONFIRMED';
          data.confirmedAt = new Date();
        }

        if (file.summary && !hasCashReport(existing.summary)) {
          // import_files.summary is the dashboard's durable source for IBKR
          // cash report totals. Older preview records may only have row counts,
          // so confirmation also backfills the richer parser summary.
          data.summary = file.summary as unknown as Prisma.InputJsonValue;
        }

        if (Object.keys(data).length > 0) {
          await tx.importFile.update({
            where: { id: existing.id },
            data,
          });
        }

        fileMap.set(file.fileHash, existing.id);
        continue;
      }

      const validDates = file.records
        .map((record) => record.data.tradeDate)
        .filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date))
        .sort();

      const importFile = await tx.importFile.create({
        data: {
          filename: file.fileName,
          userId,
          source: 'IBKR_CSV',
          fileHash: file.fileHash,
          status: 'CONFIRMED',
          periodStart: validDates[0] ? toDateOnly(validDates[0]) : null,
          periodEnd: validDates[validDates.length - 1]
            ? toDateOnly(validDates[validDates.length - 1])
            : null,
          summary: (file.summary ?? {
            totalRecords: file.records.length,
          }) as unknown as Prisma.InputJsonValue,
          previewEvents: file.records.map((record) => record.data) as unknown as
            | Prisma.InputJsonValue
            | undefined,
          confirmedAt: new Date(),
        },
      });
      fileMap.set(file.fileHash, importFile.id);
    }

    return fileMap;
  }

  private async confirmOneRecord(
    tx: Prisma.TransactionClient,
    userId: string,
    record: ImportPreviewRecord,
    importFileIds: Map<string, string>,
    seenHashes: Set<string>,
    seenTradeFingerprints: Set<string>,
    saveRawData: boolean,
  ): Promise<{
    record: ImportConfirmRecord;
    insertedRow?: Prisma.TransactionEventCreateManyInput;
    updatedTradeDate?: Date;
  }> {
    if (record.status === 'ERROR' || record.recordType === 'UNRECOGNIZED') {
      return {
        record: {
          tempId: record.tempId,
          recordType: record.recordType,
          status: 'FAILED',
          sourceHash: record.sourceHash,
          errorMessage: record.errorMessage ?? 'Record cannot be imported.',
        },
      };
    }

    if (!record.sourceHash) {
      return {
        record: {
          tempId: record.tempId,
          recordType: record.recordType,
          status: 'FAILED',
          errorMessage: 'Missing sourceHash.',
        },
      };
    }

    if (seenHashes.has(record.sourceHash)) {
      return {
        record: {
          tempId: record.tempId,
          recordType: record.recordType,
          status: 'DUPLICATE',
          sourceHash: record.sourceHash,
          errorMessage: 'Duplicate inside this import confirmation.',
        },
      };
    }
    seenHashes.add(record.sourceHash);

    const crossSourceFingerprint = createCrossSourceTradeFingerprint(record.data);
    if (crossSourceFingerprint) {
      if (seenTradeFingerprints.has(crossSourceFingerprint)) {
        return {
          record: {
            tempId: record.tempId,
            recordType: record.recordType,
            status: 'DUPLICATE',
            sourceHash: record.sourceHash,
            errorMessage: 'Duplicate trade inside this import confirmation.',
          },
        };
      }

      const crossSourceDuplicate = await this.findCrossSourceDuplicate(
        tx,
        userId,
        record.data,
        crossSourceFingerprint,
      );
      if (crossSourceDuplicate) {
        return {
          record: {
            tempId: record.tempId,
            recordType: record.recordType,
            status: 'DUPLICATE',
            sourceHash: record.sourceHash,
          },
        };
      }

      seenTradeFingerprints.add(crossSourceFingerprint);
    }

    const exactDuplicate = await tx.transactionEvent.findUnique({
      where: {
        userId_sourceEventHash: {
          userId,
          sourceEventHash: record.sourceHash,
        },
      },
      select: { id: true },
    });
    if (exactDuplicate) {
      return {
        record: {
          tempId: record.tempId,
          recordType: record.recordType,
          status: 'DUPLICATE',
          sourceHash: record.sourceHash,
        },
      };
    }

    if (record.status === 'UPDATE' && record.data.existingEventId) {
      const updated = await this.updateExistingEvent(
        tx,
        userId,
        record.data,
        saveRawData,
      );
      if (updated) {
        return {
          record: {
            tempId: record.tempId,
            recordType: record.recordType,
            status: 'UPDATED',
            sourceHash: record.sourceHash,
          },
          updatedTradeDate: toDateOnly(record.data.tradeDate),
        };
      }
    }

    const importFileId = importFileIds.get(record.data.sourceFileHash);
    if (!importFileId) {
      return {
        record: {
          tempId: record.tempId,
          recordType: record.recordType,
          status: 'FAILED',
          sourceHash: record.sourceHash,
          errorMessage: 'Import file metadata was not created.',
        },
      };
    }

    const row = buildTransactionEventRow(
      userId,
      importFileId,
      record.data,
      saveRawData,
    );
    await tx.transactionEvent.create({ data: row });

    const cashFlowRow = transactionEventToCashFlow(row);
    if (cashFlowRow) {
      await tx.cashFlow.create({
        data: cashFlowRow,
      });
    }

    return {
      record: {
        tempId: record.tempId,
        recordType: record.recordType,
        status: 'SUCCESS',
        sourceHash: record.sourceHash,
      },
      insertedRow: row,
    };
  }

  private async findCrossSourceDuplicate(
    tx: Prisma.TransactionClient,
    userId: string,
    data: NormalizedImportRecordData,
    fingerprint: string,
  ) {
    if (!data.isTrade || !data.symbol || !data.side || data.absQuantity === undefined) {
      return null;
    }

    const candidates = await tx.transactionEvent.findMany({
      where: {
        userId,
        isTrade: true,
        tradeDate: toDateOnly(data.tradeDate),
        eventType: data.eventType as Prisma.TransactionEventWhereInput['eventType'],
        symbol: data.symbol,
        side: data.side as Prisma.TransactionEventWhereInput['side'],
        absQuantity: decimal(data.absQuantity),
        price: typeof data.price === 'number' ? decimal(data.price) : null,
        currency: data.currency ?? null,
      },
      take: 20,
    });

    return (
      candidates.find(
        (candidate) => createCrossSourceTradeFingerprint(candidate) === fingerprint,
      ) ?? null
    );
  }

  private async updateExistingEvent(
    tx: Prisma.TransactionClient,
    userId: string,
    data: NormalizedImportRecordData,
    saveRawData: boolean,
  ) {
    const existing = await tx.transactionEvent.findUnique({
      where: { id: data.existingEventId },
    });

    if (!existing || existing.userId !== userId) {
      return false;
    }

    await tx.transactionEvent.update({
      where: { id: existing.id },
      data: {
        commission:
          existing.commission.equals(0) && data.commission !== 0
            ? decimal(data.commission)
            : undefined,
        price:
          existing.price === null && typeof data.price === 'number'
            ? decimal(data.price)
            : undefined,
        currency: existing.currency ?? data.currency,
        sourceEventHash: existing.sourceEventHash ?? data.sourceHash,
        rawData: saveRawData ? mergeRawData(existing.rawData, data.rawData) : undefined,
      },
    });

    return true;
  }
}
