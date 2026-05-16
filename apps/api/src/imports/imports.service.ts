import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { parseIbkrCsv } from './parsers/ibkr-csv-parser';
import {
  ImportSummary,
  ParseIssue,
  TransactionEvent,
} from './parsers/transaction-event.types';
import { createTransactionEventHash } from './transaction-event-hash';

type ImportFileWithEvents = Prisma.ImportFileGetPayload<{
  include: { transactionEvents: true };
}>;

export interface PreviewResponse {
  importFileId: string;
  source: 'IBKR_CSV';
  filename: string;
  parsedEvents: TransactionEvent[];
  summary: ImportSummary;
  warnings: ParseIssue[];
  errors: ParseIssue[];
}

function sha256(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

function toDateOnly(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function getImportPeriod(events: TransactionEvent[]) {
  const dates = events
    .map((event) => event.tradeDate)
    .filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date))
    .sort();

  return {
    periodStart: dates[0] ? toDateOnly(dates[0]) : null,
    periodEnd: dates[dates.length - 1] ? toDateOnly(dates[dates.length - 1]) : null,
  };
}

function jsonArrayToEvents(value: Prisma.JsonValue): TransactionEvent[] {
  return Array.isArray(value) ? (value as unknown as TransactionEvent[]) : [];
}

function decimalToNumber(value: Prisma.Decimal | null): number | undefined {
  return value === null ? undefined : value.toNumber();
}

function eventRowToResponse(
  event: ImportFileWithEvents['transactionEvents'][number],
) {
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
  constructor(private readonly prisma: PrismaService) {}

  async preview(file: Express.Multer.File): Promise<PreviewResponse> {
    if (!file) {
      throw new BadRequestException('CSV file is required in form field "file".');
    }

    const content = file.buffer.toString('utf8').replace(/^\uFEFF/, '');
    const fileHash = sha256(content);
    const parsed = parseIbkrCsv(content);

    if (!parsed.isSupported) {
      throw new BadRequestException({
        message: 'Unsupported IBKR Transaction History CSV.',
        errors: parsed.errors,
        warnings: parsed.warnings,
      });
    }

    const existing = await this.prisma.importFile.findUnique({
      where: { fileHash },
    });

    if (existing?.status === 'CONFIRMED') {
      throw new ConflictException({
        message: 'This IBKR CSV file has already been confirmed and imported.',
        importFileId: existing.id,
      });
    }

    const { periodStart, periodEnd } = getImportPeriod(parsed.parsedEvents);
    const data = {
      filename: file.originalname,
      source: 'IBKR_CSV' as const,
      fileHash,
      periodStart,
      periodEnd,
      status: 'PREVIEWED' as const,
      summary: parsed.summary as unknown as Prisma.InputJsonValue,
      previewEvents: parsed.parsedEvents as unknown as Prisma.InputJsonValue,
    };

    const importFile = existing
      ? await this.prisma.importFile.update({
          where: { id: existing.id },
          data,
        })
      : await this.prisma.importFile.create({ data });

    return {
      importFileId: importFile.id,
      source: 'IBKR_CSV',
      filename: importFile.filename,
      parsedEvents: parsed.parsedEvents,
      summary: parsed.summary,
      warnings: parsed.warnings,
      errors: parsed.errors,
    };
  }

  async confirm(importFileId: string) {
    const importFile = await this.prisma.importFile.findUnique({
      where: { id: importFileId },
    });

    if (!importFile) {
      throw new NotFoundException(`Import file ${importFileId} was not found.`);
    }

    if (importFile.status === 'CONFIRMED') {
      throw new ConflictException('This import file has already been confirmed.');
    }

    if (importFile.status !== 'PREVIEWED') {
      throw new ConflictException(
        `Import file status must be PREVIEWED before confirm. Current status: ${importFile.status}.`,
      );
    }

    const previewEvents = importFile.previewEvents
      ? jsonArrayToEvents(importFile.previewEvents)
      : [];

    if (previewEvents.length === 0) {
      throw new BadRequestException('No preview events are available to confirm.');
    }

    const createRows: Prisma.TransactionEventCreateManyInput[] =
      previewEvents.map((event) => ({
        importFileId,
        source: 'IBKR_CSV',
        sourceEventHash: createTransactionEventHash(event),
        sourceFileName: importFile.filename,
        sourceSection: event.sourceSection,
        rawRowIndex: event.rawRowIndex,
        rawData: event.rawData as Prisma.InputJsonValue,
        tradeDate: toDateOnly(event.tradeDate),
        accountId: event.accountId,
        description: event.description,
        ibkrType: event.ibkrType,
        eventType: event.eventType,
        symbol: event.symbol ?? null,
        quantity:
          typeof event.quantity === 'number'
            ? new Prisma.Decimal(event.quantity)
            : null,
        absQuantity:
          typeof event.absQuantity === 'number'
            ? new Prisma.Decimal(event.absQuantity)
            : null,
        price:
          typeof event.price === 'number'
            ? new Prisma.Decimal(event.price)
            : null,
        currency: event.currency ?? null,
        grossAmount: new Prisma.Decimal(event.grossAmount),
        commission: new Prisma.Decimal(event.commission),
        netAmount: new Prisma.Decimal(event.netAmount),
        side: event.side ?? null,
        isTrade: event.isTrade,
        isExternalCashFlow: event.isExternalCashFlow,
        isIncome: event.isIncome,
        isTaxOrFee: event.isTaxOrFee,
      }));

    const result = await this.prisma.$transaction(async (tx) => {
      const eventHashes = createRows
        .map((row) => row.sourceEventHash)
        .filter((hash): hash is string => typeof hash === 'string');

      const existingEvents = await tx.transactionEvent.findMany({
        where: { sourceEventHash: { in: eventHashes } },
        select: { sourceEventHash: true },
      });

      const existingHashes = new Set(
        existingEvents
          .map((event) => event.sourceEventHash)
          .filter((hash): hash is string => typeof hash === 'string'),
      );
      const seenInCurrentImport = new Set<string>();

      const rowsToCreate = createRows.filter((row) => {
        const hash = row.sourceEventHash;
        if (typeof hash !== 'string') {
          return true;
        }

        if (existingHashes.has(hash) || seenInCurrentImport.has(hash)) {
          return false;
        }

        seenInCurrentImport.add(hash);
        return true;
      });

      const createResult =
        rowsToCreate.length > 0
          ? await tx.transactionEvent.createMany({
              data: rowsToCreate,
              skipDuplicates: true,
            })
          : { count: 0 };

      const updatedImportFile = await tx.importFile.update({
        where: { id: importFileId },
        data: {
          status: 'CONFIRMED',
          confirmedAt: new Date(),
        },
        include: { transactionEvents: { orderBy: { rawRowIndex: 'asc' } } },
      });

      return {
        importFile: updatedImportFile,
        importedCount: createResult.count,
        skippedDuplicateCount: createRows.length - createResult.count,
      };
    });

    return {
      importFileId: result.importFile.id,
      filename: result.importFile.filename,
      status: result.importFile.status,
      importedCount: result.importedCount,
      skippedDuplicateCount: result.skippedDuplicateCount,
      summary: result.importFile.summary,
      confirmedAt: result.importFile.confirmedAt?.toISOString() ?? null,
    };
  }

  async findOne(id: string) {
    const importFile = await this.prisma.importFile.findUnique({
      where: { id },
      include: { transactionEvents: { orderBy: { rawRowIndex: 'asc' } } },
    });

    if (!importFile) {
      throw new NotFoundException(`Import file ${id} was not found.`);
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
