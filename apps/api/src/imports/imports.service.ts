import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { ConfirmImportDto } from './dto/confirm-import.dto';
import { ImportConfirmService } from './import-confirm.service';
import { ImportDedupService } from './import-dedup.service';
import {
  ImportPreviewFile,
  ImportPreviewRecord,
  ImportPreviewRecordType,
  ImportPreviewResponse,
  ImportPreviewSummary,
  NormalizedImportRecordData,
} from './import-preview.types';
import { parseIbkrCsv } from './parsers/ibkr-csv-parser';
import { ImportSummary, TransactionEvent } from './parsers/transaction-event.types';
import { createTransactionEventHash } from './transaction-event-hash';

const MAX_FILES = 10;
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const DEFAULT_USER_ID = 'default_user';

function sha256(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

function decimalToNumber(value: Prisma.Decimal | null): number | undefined {
  return value === null ? undefined : value.toNumber();
}

function emptySummary(): ImportPreviewSummary {
  return {
    totalRecords: 0,
    newRecords: 0,
    duplicateRecords: 0,
    updateRecords: 0,
    errorRecords: 0,
    tradeRecords: 0,
    cashFlowRecords: 0,
    corporateActionRecords: 0,
    unrecognizedRecords: 0,
  };
}

function classifyRecord(event: TransactionEvent): ImportPreviewRecordType {
  if (event.eventType === 'UNKNOWN') {
    return 'UNRECOGNIZED';
  }

  if (event.isTrade) {
    return 'TRADE';
  }

  if (
    event.eventType === 'SPLIT' ||
    event.eventType === 'REVERSE_SPLIT' ||
    event.eventType === 'ADJUSTMENT' ||
    event.eventType === 'STOCK_GRANT' ||
    event.eventType === 'STOCK_DIVIDEND' ||
    event.eventType === 'TRANSFER_IN' ||
    event.eventType === 'TRANSFER_OUT'
  ) {
    return 'CORPORATE_ACTION';
  }

  if (
    event.eventType === 'FX_COMPONENT' ||
    event.isExternalCashFlow ||
    event.isIncome ||
    event.isTaxOrFee
  ) {
    return 'CASH_FLOW';
  }

  return 'UNRECOGNIZED';
}

function getRecordError(event: TransactionEvent, warnings: string[]) {
  if (!event.tradeDate) {
    return 'Missing trade date.';
  }

  if (!event.accountId) {
    return 'Missing account id.';
  }

  if (event.eventType === 'UNKNOWN') {
    return warnings[0] ?? `Unknown IBKR type: ${event.ibkrType || '(empty)'}.`;
  }

  return undefined;
}

function toNormalizedData(
  event: TransactionEvent,
  sourceHash: string,
  fileName: string,
  fileHash: string,
  sourceFileSummary?: ImportSummary,
): NormalizedImportRecordData {
  return {
    ...event,
    sourceHash,
    sourceFileName: fileName,
    sourceFileHash: fileHash,
    sourceFileSummary,
    amount: event.netAmount,
    commission: event.commission,
  };
}

function createFileErrorRecord(
  file: Express.Multer.File,
  fileHash: string,
  message: string,
  index: number,
): ImportPreviewRecord {
  const data: NormalizedImportRecordData = {
    source: 'IBKR_CSV',
    sourceSection: 'FILE',
    rawRowIndex: 0,
    rawData: { fileName: file.originalname },
    tradeDate: '',
    accountId: '',
    description: message,
    ibkrType: 'UNRECOGNIZED',
    eventType: 'UNKNOWN',
    grossAmount: 0,
    commission: 0,
    netAmount: 0,
    isTrade: false,
    isExternalCashFlow: false,
    isIncome: false,
    isTaxOrFee: false,
    sourceFileHash: fileHash,
    sourceFileName: file.originalname,
    amount: 0,
  };

  return {
    tempId: `file-${index}-error`,
    recordType: 'UNRECOGNIZED',
    status: 'ERROR',
    data,
    rawData: data.rawData,
    errorMessage: message,
  };
}

function calculatePreviewSummary(records: ImportPreviewRecord[]) {
  const summary = emptySummary();
  summary.totalRecords = records.length;

  for (const record of records) {
    if (record.status === 'NEW') summary.newRecords += 1;
    if (record.status === 'DUPLICATE') summary.duplicateRecords += 1;
    if (record.status === 'UPDATE') summary.updateRecords += 1;
    if (record.status === 'ERROR') summary.errorRecords += 1;
    if (record.recordType === 'TRADE') summary.tradeRecords += 1;
    if (record.recordType === 'CASH_FLOW') summary.cashFlowRecords += 1;
    if (record.recordType === 'CORPORATE_ACTION') {
      summary.corporateActionRecords += 1;
    }
    if (record.recordType === 'UNRECOGNIZED') {
      summary.unrecognizedRecords += 1;
    }
  }

  return summary;
}

function eventRowToResponse(event: Prisma.TransactionEventGetPayload<object>) {
  return {
    ...event,
    tradeDate: event.tradeDate.toISOString().slice(0, 10),
    createdAt: event.createdAt.toISOString(),
    rawData: event.rawData,
    quantity: decimalToNumber(event.quantity),
    absQuantity: decimalToNumber(event.absQuantity),
    price: decimalToNumber(event.price),
    grossAmount: event.grossAmount.toNumber(),
    commission: event.commission.toNumber(),
    netAmount: event.netAmount.toNumber(),
  };
}

@Injectable()
export class ImportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly importDedupService: ImportDedupService,
    private readonly importConfirmService: ImportConfirmService,
  ) {}

  async preview(userId: string, file: Express.Multer.File) {
    return this.previewIbkrCsv(userId, file ? [file] : []);
  }

  confirm(userId: string, importFileId: string) {
    return this.importConfirmService.confirm(userId, importFileId);
  }

  async previewIbkrCsv(
    userIdOrFiles: string | Express.Multer.File[],
    maybeFiles?: Express.Multer.File[],
  ): Promise<ImportPreviewResponse> {
    const userId =
      typeof userIdOrFiles === 'string' ? userIdOrFiles : DEFAULT_USER_ID;
    const files = typeof userIdOrFiles === 'string' ? (maybeFiles ?? []) : userIdOrFiles;
    this.validateFiles(files);

    const previewFiles: ImportPreviewFile[] = [];
    const previewRecords: ImportPreviewRecord[] = [];
    const warnings: string[] = [];

    files.forEach((file, fileIndex) => {
      const content = file.buffer.toString('utf8').replace(/^\uFEFF/, '');
      const fileHash = sha256(content);
      const parsed = parseIbkrCsv(content);

      if (!parsed.isSupported) {
        const message =
          parsed.errors.map((error) => error.message).join('; ') ||
          'Unsupported IBKR Activity Statement CSV.';
        previewFiles.push({
          fileName: file.originalname,
          fileSize: file.size,
          fileHash,
          status: 'FAILED',
          totalRows: parsed.summary.totalRows,
          parsedRows: parsed.summary.parsedRows,
          errorRows: Math.max(parsed.errors.length, 1),
          errorMessage: message,
        });
        previewRecords.push(createFileErrorRecord(file, fileHash, message, fileIndex));
        warnings.push(`${file.originalname}: ${message}`);
        return;
      }

      previewFiles.push({
        fileName: file.originalname,
        fileSize: file.size,
        fileHash,
        status: 'PARSED',
        totalRows: parsed.summary.totalRows,
        parsedRows: parsed.summary.parsedRows,
        errorRows: parsed.errors.length,
      });

      previewRecords.push(
        ...this.createPreviewRecords(file, fileHash, fileIndex, parsed.summary, parsed.parsedEvents),
      );

      parsed.warnings.forEach((warning) => {
        warnings.push(
          `${file.originalname}${warning.rawRowIndex ? ` row ${warning.rawRowIndex}` : ''}: ${warning.message}`,
        );
      });
    });

    const markedRecords = await this.importDedupService.markPreviewRecords(
      userId,
      previewRecords,
    );
    const summary = calculatePreviewSummary(markedRecords);
    const importJob = await this.prisma.importJob.create({
      data: {
        source: 'IBKR_CSV',
        userId,
        status: 'PREVIEWED',
        fileNames: previewFiles.map((file) => file.fileName),
        summary: summary as unknown as Prisma.InputJsonValue,
        previewRecords: markedRecords as unknown as Prisma.InputJsonValue,
        totalCount: summary.totalRecords,
        duplicateCount: summary.duplicateRecords,
        updateCount: summary.updateRecords,
        failedCount: summary.errorRecords,
      },
    });

    return {
      jobPreviewId: importJob.id,
      files: previewFiles,
      summary,
      records: markedRecords,
      warnings,
    };
  }

  confirmIbkrCsv(
    userIdOrDto: string | ConfirmImportDto,
    maybeDto?: ConfirmImportDto,
  ) {
    const userId = typeof userIdOrDto === 'string' ? userIdOrDto : DEFAULT_USER_ID;
    const confirmImportDto = typeof userIdOrDto === 'string' ? (maybeDto as ConfirmImportDto) : userIdOrDto;
    return this.importConfirmService.confirm(
      userId,
      confirmImportDto.jobPreviewId ?? confirmImportDto.importFileId,
      confirmImportDto.records,
    );
  }

  async history(userId = DEFAULT_USER_ID) {
    const jobs = await this.prisma.importJob.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { _count: { select: { records: true } } },
    });

    return jobs.map((job) => ({
      id: job.id,
      source: job.source,
      status: job.status,
      fileNames: job.fileNames,
      summary: job.summary,
      totalCount: job.totalCount,
      successCount: job.successCount,
      duplicateCount: job.duplicateCount,
      updateCount: job.updateCount,
      failedCount: job.failedCount,
      recordCount: job._count.records,
      startedAt: job.startedAt.toISOString(),
      finishedAt: job.finishedAt?.toISOString() ?? null,
      createdAt: job.createdAt.toISOString(),
      errorMessage: job.errorMessage,
    }));
  }

  async deleteHistory(userIdOrId: string, maybeId?: string) {
    const userId = maybeId ? userIdOrId : DEFAULT_USER_ID;
    const id = maybeId ?? userIdOrId;
    const existing = await this.prisma.importJob.findUnique({
      where: { id },
      include: { _count: { select: { records: true } } },
    });

    if (!existing || existing.userId !== userId) {
      throw new NotFoundException(`Import history ${id} was not found.`);
    }

    // 这里只删除导入日志和它的 ImportRecord 审计明细。
    // 已确认导入的交易、现金流水和快照仍然保留，避免“删除历史”变成撤销导入。
    await this.prisma.importJob.delete({ where: { id } });

    return {
      success: true,
      deletedImportJobId: id,
      deletedRecordCount: existing._count.records,
    };
  }

  async findOne(userId: string, id: string) {
    const importJob = await this.prisma.importJob.findUnique({
      where: { id },
      include: { records: { orderBy: { createdAt: 'asc' } } },
    });

    if (importJob && importJob.userId === userId) {
      return {
        id: importJob.id,
        source: importJob.source,
        status: importJob.status,
        fileNames: importJob.fileNames,
        summary: importJob.summary,
        totalCount: importJob.totalCount,
        successCount: importJob.successCount,
        duplicateCount: importJob.duplicateCount,
        updateCount: importJob.updateCount,
        failedCount: importJob.failedCount,
        startedAt: importJob.startedAt.toISOString(),
        finishedAt: importJob.finishedAt?.toISOString() ?? null,
        createdAt: importJob.createdAt.toISOString(),
        errorMessage: importJob.errorMessage,
        records: importJob.records.map((record) => ({
          id: record.id,
          recordType: record.recordType,
          sourceHash: record.sourceHash,
          status: record.status,
          rawData: record.rawData,
          normalizedData: record.normalizedData,
          errorMessage: record.errorMessage,
          createdAt: record.createdAt.toISOString(),
        })),
      };
    }

    return this.findLegacyImportFile(userId, id);
  }

  private validateFiles(files: Express.Multer.File[]) {
    if (files.length === 0) {
      throw new BadRequestException('At least one CSV file is required.');
    }

    if (files.length > MAX_FILES) {
      throw new BadRequestException(`Upload at most ${MAX_FILES} CSV files.`);
    }

    files.forEach((file) => {
      if (!file.originalname.toLowerCase().endsWith('.csv')) {
        throw new BadRequestException(`${file.originalname} is not a .csv file.`);
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        throw new BadRequestException(`${file.originalname} is larger than 10 MB.`);
      }
    });
  }

  private createPreviewRecords(
    file: Express.Multer.File,
    fileHash: string,
    fileIndex: number,
    summary: ImportSummary,
    events: TransactionEvent[],
  ): ImportPreviewRecord[] {
    return events.map((event) => {
      const sourceHash = createTransactionEventHash(event);
      const recordType = classifyRecord(event);
      const rowWarnings: string[] = [];
      const errorMessage = getRecordError(event, rowWarnings);
      const status = errorMessage ? 'ERROR' : 'NEW';

      return {
        tempId: `${fileIndex}-${event.rawRowIndex}-${sourceHash.slice(0, 8)}`,
        recordType,
        status,
        sourceHash,
        data: toNormalizedData(
          event,
          sourceHash,
          file.originalname,
          fileHash,
          summary,
        ),
        rawData: event.rawData,
        errorMessage,
      };
    });
  }

  private async findLegacyImportFile(userId: string, id: string) {
    const importFile = await this.prisma.importFile.findUnique({
      where: { id },
      include: { transactionEvents: { orderBy: { rawRowIndex: 'asc' } } },
    });

    if (!importFile || importFile.userId !== userId) {
      throw new NotFoundException(`Import job ${id} was not found.`);
    }

    return {
      id: importFile.id,
      filename: importFile.filename,
      source: importFile.source,
      fileHash: importFile.fileHash,
      periodStart: importFile.periodStart?.toISOString().slice(0, 10) ?? null,
      periodEnd: importFile.periodEnd?.toISOString().slice(0, 10) ?? null,
      status: importFile.status,
      summary: importFile.summary,
      createdAt: importFile.createdAt.toISOString(),
      confirmedAt: importFile.confirmedAt?.toISOString() ?? null,
      transactionEvents: importFile.transactionEvents.map(eventRowToResponse),
    };
  }
}
